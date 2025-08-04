import { app, BrowserWindow, ipcMain, dialog, clipboard, shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import ResourceMonitor from './resourceMonitor.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let downloads = new Map();
let downloadQueue = [];
let activeDownloads = 0;
let maxConcurrentDownloads = 3;
let resourceMonitor;
let isQueuePaused = false; // Global pause state for queue processing

// Initialize process pool (disabled for now to prevent rapid process creation)
function initializeProcessPool() {
  // Process pool removed - using direct spawn for all operations
  console.log('Process pool removed - using direct spawn for all operations');
}

// Initialize resource monitoring
function initializeResourceMonitor() {
  try {
    resourceMonitor = new ResourceMonitor();
    resourceMonitor.startMonitoring(5000); // Monitor every 5 seconds
    console.log('Resource monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize resource monitor:', error);
  }
}

let settings = {
  maxConcurrentDownloads: 3,
  outputPath: path.join(process.cwd(), 'downloads'),
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
  verboseLogging: false,
  
  // Advanced Queue Settings
  queueProcessingDelay: 1000,
  maxRetriesPerDownload: 3,
  autoRetryFailed: false,
  
  // File Management
  maxFileSize: 0,
  skipExistingFiles: true,
  createSubdirectories: false,
  
  // Network & Performance
  connectionTimeout: 30,
  socketTimeout: 60,
  maxDownloadsPerHour: 0,
  
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
};

// Settings file path
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

// Load settings from file
async function loadSettings() {
  try {
    if (fsSync.existsSync(settingsPath)) {
      const data = await fs.readFile(settingsPath, 'utf8');
      const loadedSettings = JSON.parse(data);
      settings = { ...settings, ...loadedSettings };
      console.log('Loaded settings:', settings);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Save settings to file
async function saveSettings() {
  try {
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    console.log('Saved settings:', settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// Create main window
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#ffffff'
    },
    frame: false,
    show: false,
    backgroundColor: '#0f172a'
  });

  const startUrl = isDev 
    ? 'http://localhost:3111' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  console.log('Loading URL:', startUrl);
  
  // Check if the dist folder and index.html exist in production
  if (!isDev) {
    const indexPath = path.join(__dirname, '../dist/index.html');
    try {
      await fs.access(indexPath);
      console.log('Found index.html at:', indexPath);
    } catch (error) {
      console.error('index.html not found at:', indexPath);
      console.error('Make sure to run "npm run build" before packaging');
      return;
    }
  }
  
  mainWindow.loadURL(startUrl).catch((error) => {
    console.error('Failed to load URL:', error);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Add error handling for page load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Page failed to load:', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });
}

// Check if yt-dlp is available
async function checkYtDlp() {
  console.log('Checking yt-dlp availability...');
  
  return new Promise((resolve) => {
    const ytDlp = spawn('yt-dlp', ['--version']);
    
    ytDlp.on('close', (code) => {
      console.log(`yt-dlp check result: ${code === 0 ? 'available' : 'not available'} (exit code: ${code})`);
      resolve(code === 0);
    });
    
    ytDlp.on('error', (error) => {
      console.log(`yt-dlp spawn error:`, error.message);
      resolve(false);
    });
  });
}

// Check if ffmpeg is available
async function checkFfmpeg() {
  return new Promise((resolve) => {
    console.log('Checking ffmpeg availability...');
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    ffmpeg.on('close', (code) => {
      console.log(`ffmpeg check result: ${code === 0 ? 'available' : 'not available'} (exit code: ${code})`);
      resolve(code === 0);
    });
    
    ffmpeg.on('error', (error) => {
      console.log(`ffmpeg spawn error:`, error.message);
      resolve(false);
    });
  });
}

// Helper function to serialize download object for IPC
function serializeDownload(download) {
  const { process, ...serializableDownload } = download;
  
  // Convert Date objects to ISO strings for Redux serialization
  if (serializableDownload.addedAt) {
    serializableDownload.addedAt = serializableDownload.addedAt.toISOString();
  }
  if (serializableDownload.startedAt) {
    serializableDownload.startedAt = serializableDownload.startedAt.toISOString();
  }
  if (serializableDownload.completedAt) {
    serializableDownload.completedAt = serializableDownload.completedAt.toISOString();
  }
  
  return serializableDownload;
}

// App event handlers
app.whenReady().then(async () => {
  await loadSettings();
  initializeProcessPool();
  initializeResourceMonitor();
  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup processes on app exit
app.on('before-quit', () => {
  if (resourceMonitor) {
    console.log('Stopping resource monitoring...');
    resourceMonitor.cleanup();
  }
});

// Handle process termination signals
process.on('SIGTERM', () => {
  if (resourceMonitor) {
    resourceMonitor.cleanup();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  if (resourceMonitor) {
    resourceMonitor.cleanup();
  }
  process.exit(0);
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

// IPC Handlers
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('check-yt-dlp', async () => {
  return await checkYtDlp();
});

ipcMain.handle('check-ffmpeg', async () => {
  return await checkFfmpeg();
});

// Resource monitoring handlers
ipcMain.handle('get-resource-metrics', () => {
  if (resourceMonitor) {
    return resourceMonitor.getCurrentMetrics();
  }
  return null;
});

ipcMain.handle('get-resource-history', () => {
  if (resourceMonitor) {
    return resourceMonitor.getMetricsHistory();
  }
  return [];
});

ipcMain.handle('get-resource-summary', () => {
  if (resourceMonitor) {
    return resourceMonitor.getMetricsSummary();
  }
  return null;
});

ipcMain.handle('get-resource-alerts', () => {
  if (resourceMonitor) {
    return resourceMonitor.getResourceAlerts();
  }
  return [];
});

ipcMain.handle('get-downloads', () => {
  return Array.from(downloads.values()).map(serializeDownload);
});

ipcMain.handle('get-queue', () => downloadQueue);

ipcMain.handle('get-settings', () => settings);

ipcMain.handle('update-settings', (event, newSettings) => {
  settings = { ...settings, ...newSettings };
  console.log('Settings updated via IPC:', newSettings);
  return settings;
});

ipcMain.handle('save-settings', async (event, newSettings) => {
  // Merge new settings with existing settings
  settings = { ...settings, ...newSettings };
  console.log('Settings saved via IPC:', newSettings);
  console.log('All settings after merge:', settings);
  await saveSettings();
  return settings;
});

// Add log handler to send logs from main process to renderer
ipcMain.handle('add-log', (event, logData) => {
  if (mainWindow) {
    mainWindow.webContents.send('log-added', logData);
  }
  return true;
});

ipcMain.handle('add-download', async (event, url, options = {}) => {
  const id = Date.now().toString();
  
  // Fetch metadata first using direct spawn
  let metadata = null;
  try {
    metadata = await new Promise((resolve) => {
      const ytDlp = spawn('yt-dlp', [
        '--dump-json',
        '--no-playlist',
        '--no-warnings', // Reduce noise in stderr
        url
      ]);

      let output = '';
      let errorOutput = '';

      ytDlp.stdout.on('data', (data) => {
        output += data.toString();
      });

      ytDlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ytDlp.on('close', (code) => {
        if (code === 0 && output.trim()) {
          try {
            const parsedMetadata = JSON.parse(output);
            resolve(parsedMetadata);
          } catch (error) {
            console.error('Failed to parse yt-dlp output:', error);
            resolve(null);
          }
        } else {
          console.error('yt-dlp metadata extraction failed:', errorOutput);
          resolve(null);
        }
      });

      ytDlp.on('error', (error) => {
        console.error('Failed to spawn yt-dlp:', error);
        resolve(null);
      });
    });
  } catch (error) {
    console.error('Failed to fetch metadata:', error);
  }

  const download = {
    id,
    url,
    status: 'pending',
    progress: 0,
    speed: 0,
    eta: null,
    filename: '',
    filesize: 0,
    downloaded: 0,
    quality: options.quality || null,
    outputPath: options.outputPath || settings.outputPath,
    addedAt: new Date(),
    metadata: metadata,
    error: null,
    retryCount: 0
  };

  downloads.set(id, download);
  downloadQueue.push(id);
  
  // Auto-start downloads if enabled
  if (settings.autoStartDownloads) {
    processQueue();
  }
  
  return serializeDownload(download);
});

ipcMain.handle('add-playlist-videos', async (event, playlistData) => {
  const results = [];
  
  // Use the entries from metadata if available, otherwise fetch from URL
  if (playlistData.entries && playlistData.entries.length > 0) {
    // Use the entries that were already fetched in metadata
    console.log(`Adding ${playlistData.entries.length} videos from playlist metadata to queue`);
    
    for (const entry of playlistData.entries) {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const download = {
        id,
        url: entry.url,
        quality: playlistData.quality || 'best',
        outputPath: playlistData.outputPath || settings.outputPath,
        status: 'pending',
        progress: 0,
        speed: 0,
        eta: null,
        downloaded: 0,
        filesize: 0,
        startedAt: null,
        completedAt: null,
        metadata: {
          title: entry.title,
          duration: entry.duration,
          uploader: entry.uploader,
          thumbnail: entry.thumbnail
        },
        filename: null,
        retryCount: 0,
        addedAt: new Date()
      };

      downloads.set(id, download);
      downloadQueue.push(id);
      results.push(serializeDownload(download));
    }
    
    // Auto-start downloads if enabled
    if (settings.autoStartDownloads) {
      processQueue();
    }
    
    return results;
  } else if (playlistData.playlistUrl) {
    // Fallback: fetch from URL with the same limited approach as metadata
    try {
      console.log('Fetching playlist videos for:', playlistData.playlistUrl);
      
      // Use the same approach as metadata fetching
      const process = spawn('yt-dlp', [
        '--dump-json',
        '--no-warnings',
        playlistData.playlistUrl
      ]);

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('Playlist fetch stderr:', data.toString());
      });

      return new Promise((resolve) => {
        process.on('close', (code) => {
          if (code === 0 && output.trim()) {
            try {
              const lines = output.trim().split('\n').filter(line => line.trim());
              const entries = lines.map(line => JSON.parse(line));
              
              console.log(`Adding ${entries.length} videos from playlist to queue`);
              
              entries.forEach((entry, index) => {
                const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                const download = {
                  id,
                  url: entry.webpage_url || entry.url,
                  quality: playlistData.quality || 'best',
                  outputPath: playlistData.outputPath || settings.outputPath,
                  status: 'pending',
                  progress: 0,
                  speed: 0,
                  eta: null,
                  downloaded: 0,
                  filesize: 0,
                  startedAt: null,
                  completedAt: null,
                  metadata: {
                    title: entry.title,
                    duration: entry.duration || 0,
                    uploader: entry.uploader,
                    thumbnail: entry.thumbnail || ''
                  },
                  filename: null,
                  retryCount: 0,
                  addedAt: new Date()
                };

                downloads.set(id, download);
                downloadQueue.push(id);
                results.push(serializeDownload(download));
              });
              
              // Auto-start downloads if enabled
              if (settings.autoStartDownloads) {
                processQueue();
              }
              
              resolve(results);
            } catch (error) {
              console.error('Failed to parse playlist videos:', error);
              resolve([]);
            }
          } else {
            console.error('Failed to fetch playlist videos:', errorOutput);
            console.error('Process exit code:', code);
            console.error('Output length:', output.length);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Failed to fetch playlist videos:', error);
      return [];
    }
  } else {
    console.error('No playlist data provided');
    return [];
  }
});

ipcMain.handle('start-download', async (event, id) => {
  const download = downloads.get(id);
  if (!download) {
    return false;
  }

  // Update status to show initialization
  download.status = 'initializing';
  download.progress = 0;
  downloads.set(id, download);
  
  // Performance optimization: Send immediate update via batch system
  sendDownloadUpdate(download);

  // Start the download immediately
  simulateDownload(id);
  return true;
});

ipcMain.handle('start-queue', () => {
  // Resume queue processing
  isQueuePaused = false;
  processQueue();
  return true;
});

ipcMain.handle('pause-queue', () => {
  // Pause queue processing
  isQueuePaused = true;
  return true;
});

ipcMain.handle('stop-all-downloads', () => {
  // Stop all active downloads and pause queue
  isQueuePaused = true;
  
  // Kill all active download processes
  Array.from(downloads.values()).forEach(download => {
    if (download.process && download.status === 'downloading') {
      download.process.kill('SIGTERM');
      download.status = 'paused';
      downloads.set(download.id, download);
      
      // Send update to frontend
      if (mainWindow) {
        mainWindow.webContents.send('download-updated', serializeDownload(download));
      }
    }
  });
  
  return true;
});

ipcMain.handle('remove-download', (event, id) => {
  const download = downloads.get(id);
  if (download) {
    // Kill process if running
    if (download.process) {
      download.process.kill();
    }
    downloads.delete(id);
    downloadQueue = downloadQueue.filter(queueId => queueId !== id);
  }
  return true;
});

ipcMain.handle('pause-download', (event, id) => {
  const download = downloads.get(id);
  if (download && download.process) {
    download.process.kill('SIGTERM');
    download.status = 'paused';
    downloads.set(id, download);
  }
  return true;
});

ipcMain.handle('resume-download', (event, id) => {
  const download = downloads.get(id);
  if (download && download.status === 'paused') {
    download.status = 'pending';
    downloads.set(id, download);
    processQueue();
  }
  return true;
});

ipcMain.handle('retry-download', (event, id) => {
  const download = downloads.get(id);
  if (download) {
    download.status = 'pending';
    download.error = null;
    download.retryCount++;
    downloads.set(id, download);
    processQueue();
  }
  return true;
});

ipcMain.handle('clear-completed', () => {
  const completed = Array.from(downloads.values()).filter(d => 
    d.status === 'completed' || d.status === 'error'
  );
  completed.forEach(d => downloads.delete(d.id));
  return true;
});

// Performance optimization: Metadata cache
const metadataCache = new Map();
const METADATA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Performance optimization: URL validation cache
const urlValidationCache = new Map();
const URL_VALIDATION_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Performance optimization: Pre-validate URL for faster download initiation
ipcMain.handle('pre-validate-url', async (event, url) => {
  return new Promise((resolve) => {
    const cacheKey = url.trim();
    const cached = urlValidationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < URL_VALIDATION_CACHE_TTL) {
      resolve(cached.isValid);
      return;
    }

    try {
      new URL(url);
      const isValid = true;
      urlValidationCache.set(cacheKey, {
        isValid,
        timestamp: Date.now()
      });
      resolve(isValid);
    } catch (error) {
      const isValid = false;
      urlValidationCache.set(cacheKey, {
        isValid,
        timestamp: Date.now()
      });
      resolve(isValid);
    }
  });
});

// Performance optimization: Enhanced metadata fetching with process pool
ipcMain.handle('get-metadata', async (event, url) => {
  console.log('=== METADATA FETCH START ===');
  console.log('URL:', url);
  
  return new Promise((resolve) => {
    // Validate URL first
    try {
      new URL(url);
      console.log('URL validation passed');
    } catch (error) {
      console.error('Invalid URL:', url);
      resolve(null);
      return;
    }

    // Check cache first
    const cacheKey = url.trim();
    const cached = metadataCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < METADATA_CACHE_TTL) {
      console.log('Using cached metadata for:', url);
      resolve(cached.data);
      return;
    }

    console.log('Fetching metadata for:', url);
    console.log('Using direct spawn for metadata (process pool disabled)');

    // Always use direct spawn for now
    fetchMetadataWithSpawn(url, resolve);
  });
});

// Fallback function for direct spawn metadata fetching
function fetchMetadataWithSpawn(url, resolve) {
  console.log('=== DIRECT SPAWN START ===');
  console.log('Spawning yt-dlp for URL:', url);
  
  // Check if this is a playlist URL
  const isPlaylist = url.includes('playlist') || url.includes('list=');
  
  // Use minimal arguments to let yt-dlp handle requests naturally
  const args = [
    '--no-warnings'
  ];
  
  // For playlists, use dump-json to get all videos
  if (isPlaylist) {
    args.push('--dump-json');
    console.log('Detected playlist URL, fetching all videos for complete preview');
  } else {
    args.push('--dump-json');
    args.push('--no-playlist');
  }
  
  // Add the URL
  args.push(url);
  
  const process = spawn('yt-dlp', args);

  let output = '';
  let errorOutput = '';
  let startTime = Date.now();

  process.stdout.on('data', (data) => {
    output += data.toString();
    const elapsed = Date.now() - startTime;
    console.log(`Direct spawn stdout data received, length: ${data.toString().length}, elapsed: ${elapsed}ms`);
  });

  process.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.log('Direct spawn stderr data received:', data.toString());
  });

  process.on('close', (code) => {
    const elapsed = Date.now() - startTime;
    console.log(`Direct spawn metadata fetch completed with code: ${code}, elapsed: ${elapsed}ms`);
    console.log('Total output length:', output.length);
    console.log('Total error output length:', errorOutput.length);
    
    if (code === 0 && output.trim()) {
      try {
        const lines = output.trim().split('\n');
        console.log('Direct spawn JSON lines:', lines.length);
        const entries = lines.map(line => JSON.parse(line));
        
        let metadata;
        const isPlaylist = url.includes('playlist') || url.includes('list=');
        
        if (isPlaylist && entries.length > 0) {
          // This is a playlist - yt-dlp outputs one JSON object per video in the playlist
          const firstEntry = entries[0];
          const playlistTitle = firstEntry?.playlist_title || 'Playlist';
          
          metadata = {
            _type: 'playlist',
            title: playlistTitle,
            entries: entries.map(entry => ({
              id: entry.id,
              title: entry.title,
              duration: entry.duration || 0,
              uploader: entry.uploader,
              thumbnail: entry.thumbnail || '',
              url: entry.webpage_url || entry.url
            }))
          };
          
          console.log(`Playlist metadata extracted: ${entries.length} videos from ${playlistTitle}`);
        } else if (entries.length > 1) {
          // Multiple entries but not explicitly a playlist
          metadata = {
            _type: 'playlist',
            title: 'Playlist',
            entries: entries.map(entry => ({
              id: entry.id,
              title: entry.title,
              duration: entry.duration,
              uploader: entry.uploader,
              thumbnail: entry.thumbnail,
              url: entry.url || entry.webpage_url
            }))
          };
        } else {
          // Single video
          metadata = entries[0];
        }
        
        // Cache the result
        const cacheKey = url.trim();
        metadataCache.set(cacheKey, {
          data: metadata,
          timestamp: Date.now()
        });
        
        console.log('Direct spawn metadata fetched successfully:', metadata?.title || 'Unknown');
        console.log('=== DIRECT SPAWN SUCCESS ===');
        resolve(metadata);
      } catch (error) {
        console.error('Failed to parse yt-dlp output from direct spawn:', error);
        console.error('Raw output:', output);
        console.log('=== DIRECT SPAWN PARSE ERROR ===');
        resolve(null);
      }
    } else {
      console.error('yt-dlp metadata extraction failed:', errorOutput);
      console.log('=== DIRECT SPAWN FAILED ===');
      
      // Try a simpler approach if the first attempt fails
      console.log('Attempting fallback with simpler arguments...');
      const fallbackArgs = [
        '--dump-json',
        '--no-warnings',
        '--ignore-errors'
      ];
      
      if (!isPlaylist) {
        fallbackArgs.push('--no-playlist');
      }
      
      fallbackArgs.push(url);
      
      const fallbackProcess = spawn('yt-dlp', fallbackArgs);
      let fallbackOutput = '';
      let fallbackErrorOutput = '';
      
      fallbackProcess.stdout.on('data', (data) => {
        fallbackOutput += data.toString();
      });
      
      fallbackProcess.stderr.on('data', (data) => {
        fallbackErrorOutput += data.toString();
      });
      
      fallbackProcess.on('close', (fallbackCode) => {
        if (fallbackCode === 0 && fallbackOutput.trim()) {
          try {
            const lines = fallbackOutput.trim().split('\n');
            const entries = lines.map(line => JSON.parse(line));
            
            let metadata;
            if (isPlaylist && entries.length > 0) {
              const firstEntry = entries[0];
              const playlistTitle = firstEntry?.playlist_title || 'Playlist';
              
              metadata = {
                _type: 'playlist',
                title: playlistTitle,
                entries: entries.map(entry => ({
                  id: entry.id,
                  title: entry.title,
                  duration: entry.duration || 0,
                  uploader: entry.uploader,
                  thumbnail: entry.thumbnail || '',
                  url: entry.webpage_url || entry.url
                }))
              };
            } else if (entries.length > 1) {
              metadata = {
                _type: 'playlist',
                title: 'Playlist',
                entries: entries.map(entry => ({
                  id: entry.id,
                  title: entry.title,
                  duration: entry.duration,
                  uploader: entry.uploader,
                  thumbnail: entry.thumbnail,
                  url: entry.url || entry.webpage_url
                }))
              };
            } else {
              metadata = entries[0];
            }
            
            console.log('Fallback metadata fetch successful:', metadata?.title || 'Unknown');
            resolve(metadata);
          } catch (error) {
            console.error('Fallback metadata parsing failed:', error);
            resolve(null);
          }
        } else {
          console.error('Fallback metadata extraction also failed:', fallbackErrorOutput);
          resolve(null);
        }
      });
      
      fallbackProcess.on('error', (error) => {
        console.error('Fallback process error:', error);
        resolve(null);
      });
    }
  });

  process.on('error', (error) => {
    const elapsed = Date.now() - startTime;
    console.error(`Failed to spawn yt-dlp for metadata after ${elapsed}ms:`, error);
    console.log('=== DIRECT SPAWN ERROR ===');
    resolve(null);
  });
}

// Performance optimization: Pre-fetch available qualities
ipcMain.handle('get-available-qualities', async (event, url) => {
  return new Promise((resolve) => {
    // Process pool removed - using direct spawn for all operations
    // Use the same robust arguments as metadata fetching
    const isPlaylist = url.includes('playlist') || url.includes('list=');
    
    const args = [
      '--dump-json',
      '--no-warnings'
    ];
    
    if (isPlaylist) {
      // For playlists, don't use --no-playlist to allow playlist extraction
    } else {
      args.push('--no-playlist');
    }
    
    args.push(url);
    
    const process = spawn('yt-dlp', args);

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0 && output.trim()) {
        try {
          const lines = output.trim().split('\n');
          const entries = lines.map(line => JSON.parse(line));
          
          // For playlists, we can't get quality options, so return empty
          if (entries.length > 1 || (entries[0] && entries[0]._type === 'playlist')) {
            resolve([]);
            return;
          }
          
          // For single videos, extract quality options
          const metadata = entries[0];
          const qualities = [];
          
          if (metadata.formats) {
            const qualitySet = new Set();
            metadata.formats.forEach(format => {
              if (format.height) {
                qualitySet.add(`${format.height}p`);
              }
              if (format.vcodec === 'none' && format.acodec !== 'none') {
                qualitySet.add('audio');
              }
            });
            
            qualities.push(...Array.from(qualitySet).sort((a, b) => {
              if (a === 'audio') return 1;
              if (b === 'audio') return -1;
              const aHeight = parseInt(a.replace('p', ''));
              const bHeight = parseInt(b.replace('p', ''));
              return bHeight - aHeight;
            }));
          }
          
          resolve(qualities);
        } catch (error) {
          console.error('Failed to parse qualities:', error);
          resolve([]);
        }
      } else {
        resolve([]);
      }
    });

    process.on('error', (error) => {
      console.error('Failed to get qualities:', error);
      resolve([]);
    });
  });
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('select-file', async (event, filters = []) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters.length > 0 ? filters : undefined
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('get-clipboard', () => {
  return clipboard.readText();
});

ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('close-window', () => {
  mainWindow.close();
});

// Performance optimization: Batch IPC messages
const batchQueue = new Map();
const BATCH_INTERVAL = 100; // 100ms batch interval
const MAX_BATCH_SIZE = 10; // Max updates per batch
let batchTimeout = null;

// Function to add update to batch queue
const addToBatch = (channel, data) => {
  if (!batchQueue.has(channel)) {
    batchQueue.set(channel, []);
  }
  
  const queue = batchQueue.get(channel);
  queue.push(data);
  
  // Schedule batch flush
  if (!batchTimeout) {
    batchTimeout = setTimeout(flushBatch, BATCH_INTERVAL);
  }
  
  // Force flush if batch is full
  if (queue.length >= MAX_BATCH_SIZE) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
    flushBatch();
  }
};

// Function to flush all batched messages
const flushBatch = () => {
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }
  
  for (const [channel, messages] of batchQueue.entries()) {
    if (messages.length > 0) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (messages.length === 1) {
          // Single message - send directly
          mainWindow.webContents.send(channel, messages[0]);
        } else {
          // Multiple messages - send as batch
          mainWindow.webContents.send(`${channel}-batch`, messages);
        }
      }
    }
  }
  
  // Clear the queue
  batchQueue.clear();
};

// Performance optimization: Enhanced download update handling with batching
const sendDownloadUpdate = (download) => {
  addToBatch('download-updated', serializeDownload(download));
};

// Performance optimization: Enhanced log batching
const sendLogUpdate = (logData) => {
  addToBatch('log-added', logData);
};

// Download processing with rate limiting
async function processQueue() {
  // Check if queue is paused
  if (isQueuePaused) {
    console.log('Queue processing is paused');
    return;
  }

  const currentActiveDownloads = Array.from(downloads.values()).filter(d => 
    d.status === 'downloading' || d.status === 'connecting' || d.status === 'initializing' || d.status === 'processing'
  ).length;

  // Rate limiting: don't start more than maxConcurrentDownloads
  if (currentActiveDownloads >= maxConcurrentDownloads) {
    console.log(`Rate limiting: ${currentActiveDownloads} active downloads, max: ${maxConcurrentDownloads}`);
    setTimeout(processQueue, 2000); // Wait 2 seconds before trying again
    return;
  }

  const nextId = downloadQueue.find(id => {
    const download = downloads.get(id);
    return download && download.status === 'pending';
  });

  if (!nextId) return;

  const download = downloads.get(nextId);
  download.status = 'downloading';
  download.startedAt = new Date();
  downloads.set(nextId, download);

  // Start actual download process
  simulateDownload(nextId);
  
  // Log the start of download processing
  if (mainWindow) {
    mainWindow.webContents.send('log-added', {
      level: 'info',
      message: `Started processing download: ${download.url}`,
      source: 'electron',
      downloadId: nextId,
      data: { url: download.url, quality: download.quality }
    });
  }
  
  // Continue processing queue with delay to prevent rapid process creation
  setTimeout(processQueue, 1000);
}

function simulateDownload(id) {
  const download = downloads.get(id);
  if (!download) return;

  // Update status to connecting
  download.status = 'connecting';
  downloads.set(id, download);
  
  if (mainWindow) {
    mainWindow.webContents.send('download-updated', serializeDownload(download));
  }

  // Ensure output directory exists
  fs.mkdir(download.outputPath, { recursive: true }).catch(err => {
    console.error(`Failed to create output directory: ${err.message}`);
    download.error = `Failed to create output directory: ${err.message}`;
    download.status = 'error';
    downloads.set(id, download);
    
    // Performance optimization: Send update via batch system
    sendDownloadUpdate(download);
    return;
  });

  // Build yt-dlp command arguments with improved progress template
  const args = [
    '--newline',
    '--progress-template', 'download:[%(progress._percent_str)s] %(progress._speed_str)s ETA %(progress._eta_str)s downloaded %(progress._downloaded_bytes_str)s of %(progress._total_bytes_str)s',
    '--output', path.join(download.outputPath, settings.fileNamingTemplate),
    '--no-playlist',
    '--no-warnings'
  ];

  // Add custom arguments if specified
  if (settings.customYtDlpArgs.trim()) {
    // Split the arguments properly and filter out empty strings
    const customArgs = settings.customYtDlpArgs.trim().split(/\s+/).filter(arg => arg.length > 0);
    args.push(...customArgs);
  }

  // Add additional options based on settings
  if (settings.keepOriginalFiles) {
    args.push('--keep-video');
  }

  if (settings.writeSubtitles) {
    args.push('--write-subs');
  }

  if (settings.embedSubtitles) {
    args.push('--embed-subs');
  }

  if (settings.writeThumbnail) {
    args.push('--write-thumbnail');
  }

  if (settings.writeDescription) {
    args.push('--write-description');
  }

  if (settings.writeInfoJson) {
    args.push('--write-info-json');
  }

  // Add download speed limit if specified
  if (settings.downloadSpeed > 0) {
    args.push('--limit-rate', `${settings.downloadSpeed}k`);
  }

  // Add format selection based on user quality selection or preset
  if (settings.customYtDlpArgs.trim()) {
    // Check if preset arguments contain quality substitution
    let presetArgs = settings.customYtDlpArgs;
    if (presetArgs.includes('${quality}') && download.quality) {
      // Replace ${quality} with the actual quality value
      if (download.quality.includes('p')) {
        const height = download.quality.replace('p', '');
        presetArgs = presetArgs.replace(/\$\{quality\}/g, height);
      } else {
        presetArgs = presetArgs.replace(/\$\{quality\}/g, download.quality);
      }
      
      // Split the arguments and add them
      const customArgs = presetArgs.trim().split(/\s+/).filter(arg => arg.length > 0);
      args.push(...customArgs);
    } else {
      // Add preset arguments as-is
      const customArgs = settings.customYtDlpArgs.trim().split(/\s+/).filter(arg => arg.length > 0);
      args.push(...customArgs);
    }
  } else if (download.quality && download.quality.trim()) {
    // Use user-selected quality from GUI when no custom preset is active
    if (download.quality === 'audio') {
      args.push('--extract-audio', '--audio-format', 'mp3');
    } else if (download.quality === 'best') {
      // For 'best' quality, use no format specification to let yt-dlp choose the best available formats
      // This is the recommended approach according to yt-dlp documentation
    } else if (download.quality.includes('p')) {
      // For video quality like 1080p, 720p, etc.
      const height = download.quality.replace('p', '');
      // Use the most reliable format selection for quality
      args.push('--format', `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}]`);
    } else {
      // For other quality options
      args.push('--format', download.quality);
    }
  }
  // Otherwise, no format arguments - let yt-dlp choose the best available format

  args.push(download.url);

  // Create yt-dlp process with proper error handling
  let ytDlp;
  try {
    ytDlp = spawn('yt-dlp', args);
    download.process = ytDlp;

    // Log the command for debugging
    console.log(`yt-dlp command for download ${id}:`, 'yt-dlp', args.join(' '));
    console.log(`Download quality: "${download.quality}"`);
    console.log(`Custom args: "${settings.customYtDlpArgs}"`);
    
    // Log available formats for debugging
    if (download.metadata && download.metadata.formats) {
      console.log('Available formats:');
      download.metadata.formats.forEach(format => {
        if (format.height) {
          console.log(`  - ${format.format_id}: ${format.height}p, ${format.ext}, vcodec: ${format.vcodec}, acodec: ${format.acodec}`);
        }
      });
    }

    // Update status to downloading once process starts
    download.status = 'downloading';
    download.startedAt = new Date();
    downloads.set(id, download);
    
    // Performance optimization: Send update via batch system
    sendDownloadUpdate(download);
  } catch (error) {
    console.error(`Failed to spawn yt-dlp for download ${id}:`, error);
    download.status = 'error';
    download.error = error.message;
    downloads.set(id, download);
    sendDownloadUpdate(download);
    return;
  }

  ytDlp.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    
    for (const line of lines) {
      // Log important yt-dlp events to the renderer
      if (line.includes('[download]') || line.includes('[Merger]') || line.includes('[FFmpeg]')) {
        if (mainWindow) {
          mainWindow.webContents.send('log-added', {
            level: 'info',
            message: `yt-dlp: ${line.trim()}`,
            source: 'yt-dlp',
            downloadId: id,
            data: { line: line.trim() }
          });
        }
      }
      
      // Log all lines that might contain filename information
      if (line.includes('Destination:') || line.includes('[download]') || line.includes('.mp4') || line.includes('.mp3') || line.includes('.mkv')) {
        console.log(`POTENTIAL FILENAME LINE: ${line.trim()}`);
      }
      
      // Handle custom progress template with improved parsing
      if (line.startsWith('download:') || line.match(/^\[ \d+(?:\.\d+)?%\]/)) {
        // Parse the actual yt-dlp output format: [ 46.1%]    7.13MiB/s ETA 00:04 downloaded   27.10MiB of        N/A
        const progressMatch = line.match(/\[ (\d+(?:\.\d+)?)%\]/);
        const speedMatch = line.match(/(\d+(?:\.\d+)?(?:MiB|KiB|GiB|B)\/s)/);
        const etaMatch = line.match(/ETA (\d{2}:\d{2})/);
        const downloadedMatch = line.match(/downloaded\s+(\d+(?:\.\d+)?(?:MiB|KiB|GiB|B))/);
        const sizeMatch = line.match(/of\s+(~?\d+(?:\.\d+)?(?:MiB|KiB|GiB|B)|N\/A)/);
        
        if (progressMatch) {
          const progress = Math.min(100, Math.round(parseFloat(progressMatch[1])));
          download.progress = progress;
          download.status = 'downloading';
          
          // Update other fields if available
          if (speedMatch) {
            download.speed = parseSpeedString(speedMatch[1]);
            console.log(`Speed parsed: ${speedMatch[1]} -> ${download.speed}`);
          }
          
          if (etaMatch) {
            download.eta = parseEtaString(etaMatch[1]);
            console.log(`ETA parsed: ${etaMatch[1]} -> ${download.eta}`);
          }
          
          if (downloadedMatch) {
            const downloadedStr = downloadedMatch[1];
            download.downloaded = parseSizeString(downloadedStr);
            console.log(`Downloaded parsed: ${downloadedStr} -> ${download.downloaded}`);
          }
          
          if (sizeMatch && sizeMatch[1] !== 'N/A') {
            download.filesize = parseSizeString(sizeMatch[1]);
            console.log(`Filesize parsed: ${sizeMatch[1]} -> ${download.filesize}`);
          }
          
          // If we have progress and total size but no downloaded bytes, calculate it
          if (download.progress > 0 && download.filesize > 0 && !download.downloaded) {
            download.downloaded = Math.round((download.progress / 100) * download.filesize);
          }
          
          console.log(`Progress update for ${id}: ${progress}%, speed: ${download.speed}, eta: ${download.eta}, downloaded: ${download.downloaded}, filesize: ${download.filesize}`);
          
          downloads.set(id, download);
          
          // Performance optimization: Send update via batch system
          sendDownloadUpdate(download);
        }
      }
      // Handle processing/merging status
      else if (line.includes('[Merger]') || line.includes('[FFmpeg]') || line.includes('[ExtractAudio]')) {
        download.status = 'processing';
        downloads.set(id, download);
        
        // Performance optimization: Send update via batch system
        sendDownloadUpdate(download);
      }
      // Extract filename from download line
      else if (line.includes('[download]')) {
        console.log(`Processing download line: ${line.trim()}`);
        const filenameMatch = line.match(/Destination: (.+)/);
        if (filenameMatch) {
          download.filename = path.basename(filenameMatch[1]);
          console.log(`Filename extracted: ${download.filename}`);
          downloads.set(id, download);
        } else {
          console.log(`No Destination: found in download line`);
        }
      }
      // Extract filename from various download messages
      else if (line.includes('has already been downloaded') || line.includes('already exists')) {
        const filenameMatch = line.match(/\[download\] (.+) has already been downloaded/);
        if (filenameMatch) {
          download.filename = path.basename(filenameMatch[1]);
          console.log(`Filename from existing file: ${download.filename}`);
          downloads.set(id, download);
        }
      }
      // Extract filename from any line containing a file path
      else if (line.includes('/') || line.includes('\\')) {
        const filenameMatch = line.match(/([^\/\\]+\.(mp4|mp3|mkv|avi|mov|wmv|flv|webm|m4a|aac|ogg|wav))$/);
        if (filenameMatch && !download.filename) {
          download.filename = filenameMatch[1];
          console.log(`Filename from path: ${download.filename}`);
          downloads.set(id, download);
        }
      }
      // Extract filename from merger output specifically (must come first)
      if (line.includes('[Merger]') && line.includes('Merging formats into')) {
        console.log(`Processing merger line: ${line.trim()}`);
        const filenameMatch = line.match(/Merging formats into "([^"]+)"/);
        // Alternative pattern in case the first one fails
        const filenameMatch2 = line.match(/Merging formats into "(.+?)"/);
        if (filenameMatch) {
          download.filename = path.basename(filenameMatch[1]);
          console.log(`Filename from merger: ${download.filename}`);
          downloads.set(id, download);
        } else if (filenameMatch2) {
          download.filename = path.basename(filenameMatch2[1]);
          console.log(`Filename from merger (alt): ${download.filename}`);
          downloads.set(id, download);
        } else {
          console.log(`Merger regex didn't match. Line: ${line.trim()}`);
        }
      }
      // Extract filename from various yt-dlp output patterns
      else if (line.includes('[Merger]') || line.includes('[FFmpeg]') || line.includes('[ExtractAudio]')) {
        // Try to extract filename from processing messages
        const filenameMatch = line.match(/([^\/\\]+\.(mp4|mp3|mkv|avi|mov|wmv|flv|webm|m4a|aac|ogg|wav))$/);
        if (filenameMatch) {
          download.filename = filenameMatch[1];
          console.log(`Filename from processing: ${download.filename}`);
          downloads.set(id, download);
        }
      }
      // Extract filename from any line that might contain a file path
      else if (line.includes('.mp4') || line.includes('.mp3') || line.includes('.mkv')) {
        const filenameMatch = line.match(/([^\/\\]+\.(mp4|mp3|mkv|avi|mov|wmv|flv|webm|m4a|aac|ogg|wav))$/);
        if (filenameMatch && !download.filename) {
          download.filename = filenameMatch[1];
          console.log(`Filename from file extension: ${download.filename}`);
          downloads.set(id, download);
        }
      }
      // Handle fallback progress parsing for older yt-dlp versions or different output formats
      else if (line.includes('%')) {
        // Try to parse the actual yt-dlp output format: [ 46.1%]    7.13MiB/s ETA 00:04 downloaded   27.10MiB of        N/A
        const progressMatch = line.match(/\[ (\d+(?:\.\d+)?)%\]/);
        const speedMatch = line.match(/(\d+(?:\.\d+)?(?:MiB|KiB|GiB|B)\/s)/);
        const etaMatch = line.match(/ETA (\d{2}:\d{2})/);
        const downloadedMatch = line.match(/downloaded\s+(\d+(?:\.\d+)?(?:MiB|KiB|GiB|B))/);
        const sizeMatch = line.match(/of\s+(~?\d+(?:\.\d+)?(?:MiB|KiB|GiB|B)|N\/A)/);
        
        if (progressMatch) {
          const progress = Math.min(100, Math.round(parseFloat(progressMatch[1])));
          download.progress = progress;
          download.status = 'downloading';
          
          // Update other fields if available
          if (speedMatch) {
            download.speed = parseSpeedString(speedMatch[1]);
          }
          
          if (etaMatch) {
            download.eta = parseEtaString(etaMatch[1]);
          }
          
          if (downloadedMatch) {
            const downloadedStr = downloadedMatch[1];
            download.downloaded = parseSizeString(downloadedStr);
          }
          
          if (sizeMatch && sizeMatch[1] !== 'N/A') {
            download.filesize = parseSizeString(sizeMatch[1]);
          }
          
          downloads.set(id, download);
          
          if (mainWindow) {
            mainWindow.webContents.send('download-updated', serializeDownload(download));
          }
        }
      }
      // Handle speed and ETA information as fallback
      else if (line.includes('MiB/s') || line.includes('KiB/s') || line.includes('GiB/s')) {
        const speedMatch = line.match(/(\d+(?:\.\d+)?(?:MiB|KiB|GiB|B)\/s)/);
        const etaMatch = line.match(/ETA (\d{2}:\d{2})/);
        
        if (speedMatch) {
          download.speed = parseSpeedString(speedMatch[1]);
        }
        
        if (etaMatch) {
          download.eta = parseEtaString(etaMatch[1]);
        }
        
        downloads.set(id, download);
        
        // Performance optimization: Send update via batch system
        sendDownloadUpdate(download);
      }
    }
  });

  ytDlp.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`yt-dlp error for download ${id}:`, error);
    
    // Performance optimization: Send error via batch system
    sendLogUpdate({
      level: 'error',
      message: `yt-dlp error: ${error.trim()}`,
      source: 'yt-dlp',
      downloadId: id,
      data: { error: error.trim() }
    });
    
    // Only treat actual ERROR lines as errors, not warnings
    if (error.includes('ERROR:')) {
      let errorMessage = error;
      
      // Provide more user-friendly error messages
      if (error.includes('403: Forbidden')) {
        errorMessage = 'Access denied (403). This video might be private, age-restricted, or require authentication.';
      } else if (error.includes('404: Not Found')) {
        errorMessage = 'Video not found (404). The URL might be invalid or the video has been removed.';
      } else if (error.includes('Video unavailable')) {
        errorMessage = 'This video is unavailable. It might be private, deleted, or region-restricted.';
      } else if (error.includes('Sign in to confirm your age')) {
        errorMessage = 'This video requires age verification. Please sign in to YouTube to watch this video.';
      } else if (error.includes('Requested format is not available')) {
        errorMessage = 'The selected format is not available for this video. Try a different preset or quality setting.';
      }
      
      download.error = errorMessage;
      download.status = 'error';
      downloads.set(id, download);
      
      if (mainWindow) {
        mainWindow.webContents.send('download-updated', serializeDownload(download));
      }
    } else if (error.includes('WARNING:')) {
      // Just log warnings, don't treat as errors
      console.warn(`yt-dlp warning for download ${id}:`, error);
      
      // Performance optimization: Send warning via batch system
      sendLogUpdate({
        level: 'warning',
        message: `yt-dlp warning: ${error.trim()}`,
        source: 'yt-dlp',
        downloadId: id,
        data: { warning: error.trim() }
      });
    }
  });

  ytDlp.on('close', async (code) => {
    if (code === 0) {
      download.status = 'completed';
      download.progress = 100;
      download.completedAt = new Date();
      download.process = null;
      
      console.log(`Download completed for ${id}, filename: ${download.filename}, outputPath: ${download.outputPath}`);
      
      // Wait a moment for the file to be fully written
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set filename if not already set
      if (!download.filename && download.metadata?.title) {
        download.filename = `${download.metadata.title}.${download.quality === 'audio' ? 'mp3' : 'mp4'}`;
        console.log(`Generated filename: ${download.filename}`);
      }
      
      // Get actual file size from filesystem
      try {
        if (download.filename) {
          const filePath = path.join(download.outputPath, download.filename);
          console.log(`Looking for file at: ${filePath}`);
          const stats = await fs.stat(filePath);
          download.filesize = stats.size;
          download.downloaded = stats.size; // Set downloaded to actual size
          console.log(`Actual file size for ${download.filename}: ${stats.size} bytes`);
        } else {
          // Fallback: find the most recently modified file in the output directory
          console.log(`No filename available, searching for latest file in: ${download.outputPath}`);
          const files = await fs.readdir(download.outputPath);
          console.log(`Found files in directory:`, files);
          
          // Log file details for debugging
          for (const file of files) {
            try {
              const filePath = path.join(download.outputPath, file);
              const stats = await fs.stat(filePath);
              console.log(`File: ${file}, Size: ${stats.size}, Modified: ${stats.mtime}`);
            } catch (error) {
              console.log(`Could not stat file: ${file}`);
            }
          }
          let latestFile = null;
          let latestTime = 0;
          
          for (const file of files) {
            const filePath = path.join(download.outputPath, file);
            const stats = await fs.stat(filePath);
            if (stats.mtime.getTime() > latestTime) {
              latestTime = stats.mtime.getTime();
              latestFile = file;
            }
          }
          
          if (latestFile) {
            download.filename = latestFile;
            const filePath = path.join(download.outputPath, latestFile);
            const stats = await fs.stat(filePath);
            download.filesize = stats.size;
            download.downloaded = stats.size;
            console.log(`Found actual file: ${latestFile}, size: ${stats.size} bytes`);
          } else {
            console.log(`No files found in output directory`);
            
            // Try to find file by metadata title
            if (download.metadata?.title) {
              const safeTitle = download.metadata.title.replace(/[<>:"/\\|?*]/g, '_');
              const possibleExtensions = download.quality === 'audio' ? ['.mp3', '.m4a', '.aac', '.ogg'] : ['.mp4', '.mkv', '.avi', '.mov'];
              
              for (const ext of possibleExtensions) {
                const possibleFilename = safeTitle + ext;
                const filePath = path.join(download.outputPath, possibleFilename);
                try {
                  const stats = await fs.stat(filePath);
                  download.filename = possibleFilename;
                  download.filesize = stats.size;
                  download.downloaded = stats.size;
                  console.log(`Found file by title: ${possibleFilename}, size: ${stats.size} bytes`);
                  break;
                } catch (error) {
                  // File doesn't exist with this extension, try next
                }
              }
            }
            
            // Final fallback: look for the most recently created .mp4 file (likely the merged file)
            if (!download.filename) {
              console.log(`Looking for most recent .mp4 file as fallback`);
              let latestMp4File = null;
              let latestTime = 0;
              
              for (const file of files) {
                if (file.endsWith('.mp4')) {
                  const filePath = path.join(download.outputPath, file);
                  try {
                    const stats = await fs.stat(filePath);
                    if (stats.mtime.getTime() > latestTime) {
                      latestTime = stats.mtime.getTime();
                      latestMp4File = file;
                    }
                  } catch (error) {
                    // Skip files we can't access
                  }
                }
              }
              
              if (latestMp4File) {
                download.filename = latestMp4File;
                const filePath = path.join(download.outputPath, latestMp4File);
                const stats = await fs.stat(filePath);
                download.filesize = stats.size;
                download.downloaded = stats.size;
                console.log(`Found most recent .mp4 file: ${latestMp4File}, size: ${stats.size} bytes`);
              }
            }
          }
        }
        
        // Always try to update the size even if we have a filename, in case the file was renamed or processed
        if (download.filename) {
          const filePath = path.join(download.outputPath, download.filename);
          try {
            const stats = await fs.stat(filePath);
            const actualSize = stats.size;
            if (actualSize !== download.filesize) {
              console.log(`Size mismatch detected! Estimated: ${download.filesize}, Actual: ${actualSize}`);
              download.filesize = actualSize;
              download.downloaded = actualSize;
            }
          } catch (error) {
            console.log(`Could not verify file size for ${download.filename}: ${error.message}`);
          }
        }
      } catch (error) {
        console.error(`Failed to get actual file size: ${error.message}`);
        // Keep the estimated size if we can't get the actual size
      }
      
      downloads.set(id, download);
      
      // Send update to renderer
      if (mainWindow) {
        mainWindow.webContents.send('download-updated', serializeDownload(download));
      }
    } else {
      download.status = 'error';
      download.error = `yt-dlp exited with code ${code}`;
      download.process = null;
      downloads.set(id, download);
      
      // Performance optimization: Send update via batch system
      sendDownloadUpdate(download);
    }
    
    // Process next in queue with delay to prevent rapid process creation
    setTimeout(processQueue, 2000);
  });

  ytDlp.on('error', (error) => {
    console.error(`Failed to spawn yt-dlp for download ${id}:`, error);
    download.status = 'error';
    download.error = error.message;
    download.process = null;
    downloads.set(id, download);
    
    // Performance optimization: Send update via batch system
    sendDownloadUpdate(download);
    
    // Process next in queue with delay to prevent rapid process creation
    setTimeout(processQueue, 2000);
  });
}

// Helper function to parse speed strings like "1.2MiB/s" to bytes per second
function parseSpeedString(speedStr) {
  if (!speedStr) return 0;
  
  const match = speedStr.match(/^(\d+(?:\.\d+)?)(MiB|KiB|GiB|B)\/s$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'GiB':
      return value * 1024 * 1024 * 1024;
    case 'MiB':
      return value * 1024 * 1024;
    case 'KiB':
      return value * 1024;
    case 'B':
      return value;
    default:
      return 0;
  }
}

// Helper function to parse size strings like "150.5MiB" to bytes
function parseSizeString(sizeStr) {
  if (!sizeStr) return 0;
  
  // Remove the tilde if present (indicating approximate size)
  const cleanStr = sizeStr.replace('~', '');
  
  const match = cleanStr.match(/^(\d+(?:\.\d+)?)(MiB|KiB|GiB|B)$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'GiB':
      return value * 1024 * 1024 * 1024;
    case 'MiB':
      return value * 1024 * 1024;
    case 'KiB':
      return value * 1024;
    case 'B':
      return value;
    default:
      return 0;
  }
}

// Helper function to parse ETA strings like "05:30" or "1:23:45" to seconds
function parseEtaString(etaStr) {
  if (!etaStr || etaStr === '--:--' || etaStr === '00:00') return null;
  
  const parts = etaStr.split(':').map(Number);
  
  if (parts.length === 2) {
    // mm:ss format
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // h:mm:ss format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  return null;
}

// Test process pool functionality
ipcMain.handle('test-process-pool', async () => {
  console.log('Testing process pool...');
  console.log('Process pool available:', false); // Process pool removed
  
  return { success: false, error: 'Process pool disabled - using direct spawn' };
});

// Test yt-dlp availability
ipcMain.handle('test-yt-dlp', async () => {
  console.log('Testing yt-dlp availability...');
  
  return new Promise((resolve) => {
    const process = spawn('yt-dlp', ['--version']);
    
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    process.on('close', (code) => {
      console.log('yt-dlp test completed with code:', code);
      console.log('yt-dlp version output:', output.trim());
      console.log('yt-dlp error output:', errorOutput);
      
      if (code === 0) {
        resolve({ success: true, version: output.trim() });
      } else {
        resolve({ success: false, error: errorOutput || 'Unknown error' });
      }
    });
    
    process.on('error', (error) => {
      console.error('Failed to spawn yt-dlp:', error);
      resolve({ success: false, error: error.message });
    });
  });
});