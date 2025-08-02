import { store } from '../store/store';
import { addLog } from '../store/slices/uiSlice';

export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  downloadId?: string;
  source?: string;
  data?: any;
}

class Logger {
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
    info: typeof console.info;
  };

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      info: console.info,
    };

    // Override console methods to capture logs
    this.interceptConsole();
  }

  private interceptConsole() {
    // Override console.log - only log important ones, skip verbose info
    console.log = (...args: any[]) => {
      this.originalConsole.log(...args);
      const message = this.formatConsoleMessage(args);
      
      // Check if verbose logging is enabled
      const settings = store.getState().settings.data;
      const verboseLogging = settings?.verboseLogging || false;
      
      // Only log console.log if it contains important keywords or verbose logging is enabled
      if (verboseLogging || this.isImportantLog(message)) {
        this.addLog('info', message, 'console');
      }
    };

    // Override console.warn - always log warnings
    console.warn = (...args: any[]) => {
      this.originalConsole.warn(...args);
      this.addLog('warning', this.formatConsoleMessage(args), 'console');
    };

    // Override console.error - always log errors
    console.error = (...args: any[]) => {
      this.originalConsole.error(...args);
      this.addLog('error', this.formatConsoleMessage(args), 'console');
    };

    // Override console.debug - only log important debug messages
    console.debug = (...args: any[]) => {
      this.originalConsole.debug(...args);
      const message = this.formatConsoleMessage(args);
      
      // Check if verbose logging is enabled
      const settings = store.getState().settings.data;
      const verboseLogging = settings?.verboseLogging || false;
      
      // Only log debug if it contains important keywords or verbose logging is enabled
      if (verboseLogging || this.isImportantDebug(message)) {
        this.addLog('debug', message, 'console');
      }
    };

    // Override console.info - skip most info logs, only important ones
    console.info = (...args: any[]) => {
      this.originalConsole.info(...args);
      const message = this.formatConsoleMessage(args);
      
      // Check if verbose logging is enabled
      const settings = store.getState().settings.data;
      const verboseLogging = settings?.verboseLogging || false;
      
      // Only log info if it contains important keywords or verbose logging is enabled
      if (verboseLogging || this.isImportantLog(message)) {
        this.addLog('info', message, 'console');
      }
    };
  }

  private isImportantLog(message: string): boolean {
    const importantKeywords = [
      'error', 'failed', 'failure', 'exception', 'crash', 'timeout',
      'yt-dlp', 'ffmpeg', 'spawn', 'process',
      'network', 'fetch', 'request', 'response',
      'settings', 'config', 'preset', 'quality',
      'file', 'path', 'directory', 'access', 'permission',
      'electron', 'main', 'renderer', 'ipc',
      'queue', 'status', 'complete', 'cancel'
    ];
    
    const lowerMessage = message.toLowerCase();
    
    // Exclude common initialization messages
    const excludePatterns = [
      'loaded 0 downloads',
      'loaded downloads',
      'initialized',
      'application started',
      'logger initialized'
    ];
    
    // Exclude download progress and basic status messages
    const downloadExcludePatterns = [
      'download started',
      'download completed',
      'download failed',
      'progress:',
      'destination:',
      'merging formats'
    ];
    
    // Don't log if it matches exclusion patterns
    if (excludePatterns.some(pattern => lowerMessage.includes(pattern))) {
      return false;
    }
    
    // Don't log basic download status messages
    if (downloadExcludePatterns.some(pattern => lowerMessage.includes(pattern))) {
      return false;
    }
    
    return importantKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private isImportantDebug(message: string): boolean {
    const importantDebugKeywords = [
      'yt-dlp', 'ffmpeg', 'process', 'spawn',
      'error', 'failed', 'exception', 'timeout',
      'electron', 'ipc', 'main', 'renderer',
      'settings', 'config', 'preset'
    ];
    
    const lowerMessage = message.toLowerCase();
    
    // Exclude download progress and basic status messages
    const downloadExcludePatterns = [
      'download started',
      'download completed',
      'download failed',
      'progress:',
      'destination:',
      'merging formats'
    ];
    
    // Don't log basic download status messages
    if (downloadExcludePatterns.some(pattern => lowerMessage.includes(pattern))) {
      return false;
    }
    
    return importantDebugKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private formatConsoleMessage(args: any[]): string {
    return args
      .map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
  }

  public addLog(level: LogLevel, message: string, source?: string, downloadId?: string, data?: any) {
    const logEntry: LogEntry = {
      level,
      message,
      source,
      downloadId,
      data,
    };

    // Dispatch to Redux store
    store.dispatch(addLog(logEntry));

    // Also log to original console for debugging
    switch (level) {
      case 'error':
        this.originalConsole.error(`[${source || 'app'}] ${message}`, data);
        break;
      case 'warning':
        this.originalConsole.warn(`[${source || 'app'}] ${message}`, data);
        break;
      case 'debug':
        this.originalConsole.debug(`[${source || 'app'}] ${message}`, data);
        break;
      default:
        this.originalConsole.log(`[${source || 'app'}] ${message}`, data);
    }
  }

  public info(message: string, source?: string, downloadId?: string, data?: any) {
    this.addLog('info', message, source, downloadId, data);
  }

  public warn(message: string, source?: string, downloadId?: string, data?: any) {
    this.addLog('warning', message, source, downloadId, data);
  }

  public error(message: string, source?: string, downloadId?: string, data?: any) {
    this.addLog('error', message, source, downloadId, data);
  }

  public debug(message: string, source?: string, downloadId?: string, data?: any) {
    this.addLog('debug', message, source, downloadId, data);
  }

  // Capture unhandled errors
  public captureGlobalErrors() {
    window.addEventListener('error', (event) => {
      this.error(`Unhandled error: ${event.message}`, 'global', undefined, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error(`Unhandled promise rejection: ${event.reason}`, 'global', undefined, {
        reason: event.reason,
      });
    });
  }

  // Capture network errors
  public captureNetworkErrors() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          this.warn(`Network request failed: ${response.status} ${response.statusText}`, 'network', undefined, {
            url: args[0],
            status: response.status,
            statusText: response.statusText,
          });
        }
        return response;
      } catch (error) {
        this.error(`Network request error: ${error}`, 'network', undefined, {
          url: args[0],
          error: error,
        });
        throw error;
      }
    };
  }
}

// Create and export logger instance
export const logger = new Logger();

// Initialize global error capturing
logger.captureGlobalErrors();
logger.captureNetworkErrors();

// Listen for logs from Electron main process
if (window.electronAPI) {
  window.electronAPI.onLogAdded((logData: any) => {
    logger.addLog(
      logData.level,
      logData.message,
      logData.source,
      logData.downloadId,
      logData.data
    );
  });
}

// Logger is now ready 