import chokidar from 'chokidar';
import path from 'path';
import { FileOperations } from '../src/utils/fileOperations.js';

/**
 * File watching system for real-time file system monitoring
 * Monitors download directories for new files and changes
 */
class FileWatcher {
  constructor() {
    this.watchers = new Map();
    this.callbacks = new Map();
    this.isWatching = false;
    this.watchOptions = {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      },
      ignored: [
        /(^|[\/\\])\../, // Ignore dotfiles
        /\.tmp$/, // Ignore temp files
        /\.part$/, // Ignore partial downloads
        /\.ytdl$/, // Ignore yt-dlp temp files
        '**/node_modules/**',
        '**/.git/**'
      ]
    };
  }

  /**
   * Start watching a directory for file changes
   */
  async startWatching(dirPath, options = {}) {
    if (this.watchers.has(dirPath)) {
      console.log(`Already watching directory: ${dirPath}`);
      return;
    }

    try {
      // Ensure directory exists
      const dirExists = await FileOperations.fileExists(dirPath);
      if (!dirExists) {
        console.warn(`Directory does not exist: ${dirPath}`);
        return;
      }

      const watcher = chokidar.watch(dirPath, {
        ...this.watchOptions,
        ...options
      });

      // Set up event handlers
      watcher
        .on('add', (filePath) => this.handleFileAdded(filePath, dirPath))
        .on('change', (filePath) => this.handleFileChanged(filePath, dirPath))
        .on('unlink', (filePath) => this.handleFileRemoved(filePath, dirPath))
        .on('error', (error) => this.handleError(error, dirPath))
        .on('ready', () => this.handleReady(dirPath));

      this.watchers.set(dirPath, watcher);
      this.isWatching = true;

      console.log(`Started watching directory: ${dirPath}`);
    } catch (error) {
      console.error(`Failed to start watching directory ${dirPath}:`, error);
    }
  }

  /**
   * Stop watching a directory
   */
  stopWatching(dirPath) {
    const watcher = this.watchers.get(dirPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(dirPath);
      this.callbacks.delete(dirPath);
      console.log(`Stopped watching directory: ${dirPath}`);
    }
  }

  /**
   * Stop all watchers
   */
  stopAllWatchers() {
    for (const [dirPath, watcher] of this.watchers) {
      watcher.close();
      console.log(`Stopped watching directory: ${dirPath}`);
    }
    this.watchers.clear();
    this.callbacks.clear();
    this.isWatching = false;
  }

  /**
   * Register callbacks for file events
   */
  onFileEvent(dirPath, eventType, callback) {
    if (!this.callbacks.has(dirPath)) {
      this.callbacks.set(dirPath, new Map());
    }
    
    const dirCallbacks = this.callbacks.get(dirPath);
    if (!dirCallbacks.has(eventType)) {
      dirCallbacks.set(eventType, []);
    }
    
    dirCallbacks.get(eventType).push(callback);
  }

  /**
   * Handle file added event
   */
  async handleFileAdded(filePath, dirPath) {
    try {
      console.log(`File added: ${filePath}`);
      
      // Get file stats
      const stats = await FileOperations.getFileStats(filePath);
      if (!stats.success) {
        console.error(`Failed to get stats for ${filePath}:`, stats.error);
        return;
      }

      // Check if file is complete (not a partial download)
      const isComplete = this.isFileComplete(filePath, stats.data);
      
      const eventData = {
        type: 'add',
        filePath,
        dirPath,
        fileName: path.basename(filePath),
        fileSize: stats.data.size,
        isComplete,
        timestamp: Date.now()
      };

      this.notifyCallbacks(dirPath, 'add', eventData);
    } catch (error) {
      console.error(`Error handling file added event for ${filePath}:`, error);
    }
  }

  /**
   * Handle file changed event
   */
  async handleFileChanged(filePath, dirPath) {
    try {
      console.log(`File changed: ${filePath}`);
      
      const stats = await FileOperations.getFileStats(filePath);
      if (!stats.success) {
        console.error(`Failed to get stats for ${filePath}:`, stats.error);
        return;
      }

      const eventData = {
        type: 'change',
        filePath,
        dirPath,
        fileName: path.basename(filePath),
        fileSize: stats.data.size,
        timestamp: Date.now()
      };

      this.notifyCallbacks(dirPath, 'change', eventData);
    } catch (error) {
      console.error(`Error handling file changed event for ${filePath}:`, error);
    }
  }

  /**
   * Handle file removed event
   */
  handleFileRemoved(filePath, dirPath) {
    try {
      console.log(`File removed: ${filePath}`);
      
      const eventData = {
        type: 'remove',
        filePath,
        dirPath,
        fileName: path.basename(filePath),
        timestamp: Date.now()
      };

      this.notifyCallbacks(dirPath, 'remove', eventData);
    } catch (error) {
      console.error(`Error handling file removed event for ${filePath}:`, error);
    }
  }

  /**
   * Handle watcher error
   */
  handleError(error, dirPath) {
    console.error(`File watcher error for ${dirPath}:`, error);
    
    const eventData = {
      type: 'error',
      dirPath,
      error: error.message,
      timestamp: Date.now()
    };

    this.notifyCallbacks(dirPath, 'error', eventData);
  }

  /**
   * Handle watcher ready event
   */
  handleReady(dirPath) {
    console.log(`File watcher ready for: ${dirPath}`);
    
    const eventData = {
      type: 'ready',
      dirPath,
      timestamp: Date.now()
    };

    this.notifyCallbacks(dirPath, 'ready', eventData);
  }

  /**
   * Notify registered callbacks for an event
   */
  notifyCallbacks(dirPath, eventType, eventData) {
    const dirCallbacks = this.callbacks.get(dirPath);
    if (!dirCallbacks) return;

    const callbacks = dirCallbacks.get(eventType);
    if (!callbacks) return;

    callbacks.forEach(callback => {
      try {
        callback(eventData);
      } catch (error) {
        console.error(`Error in file watcher callback for ${eventType}:`, error);
      }
    });
  }

  /**
   * Check if a file is complete (not a partial download)
   */
  isFileComplete(filePath, stats) {
    const fileName = path.basename(filePath);
    
    // Check for common partial download indicators
    const isPartial = fileName.includes('.part') || 
                     fileName.includes('.tmp') || 
                     fileName.includes('.ytdl') ||
                     fileName.includes('.download');
    
    // Check if file size is stable (not actively being written)
    const isStable = stats.size > 0 && !isPartial;
    
    return isStable;
  }

  /**
   * Get list of watched directories
   */
  getWatchedDirectories() {
    return Array.from(this.watchers.keys());
  }

  /**
   * Get watcher statistics
   */
  getStats() {
    const stats = {
      isWatching: this.isWatching,
      watchedDirectories: this.getWatchedDirectories(),
      totalWatchers: this.watchers.size,
      totalCallbacks: Array.from(this.callbacks.values())
        .reduce((total, dirCallbacks) => total + dirCallbacks.size, 0)
    };

    return stats;
  }

  /**
   * Check if a directory is being watched
   */
  isWatchingDirectory(dirPath) {
    return this.watchers.has(dirPath);
  }

  /**
   * Get file count in a watched directory
   */
  async getFileCount(dirPath) {
    const watcher = this.watchers.get(dirPath);
    if (!watcher) return 0;

    try {
      const files = await FileOperations.readDirectory(dirPath);
      return files.success ? files.data.length : 0;
    } catch (error) {
      console.error(`Failed to get file count for ${dirPath}:`, error);
      return 0;
    }
  }

  /**
   * Get disk usage for a watched directory
   */
  async getDiskUsage(dirPath) {
    try {
      const diskSpace = await FileOperations.getDiskSpace(dirPath);
      return diskSpace.success ? diskSpace.data : 0;
    } catch (error) {
      console.error(`Failed to get disk usage for ${dirPath}:`, error);
      return 0;
    }
  }
}

export default FileWatcher; 