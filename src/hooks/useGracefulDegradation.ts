import { useState, useEffect, useCallback } from 'react';

interface DegradationState {
  isElectronAvailable: boolean;
  isYtDlpAvailable: boolean;
  isFfmpegAvailable: boolean;
  isOnline: boolean;
  hasStorageAccess: boolean;
  hasFileSystemAccess: boolean;
}

interface DegradationActions {
  retryConnection: () => Promise<void>;
  retryYtDlpCheck: () => Promise<boolean>;
  retryFfmpegCheck: () => Promise<boolean>;
  checkOnlineStatus: () => Promise<boolean>;
}

/**
 * Hook for graceful degradation when features are unavailable
 * Provides fallback behavior and retry mechanisms
 */
export const useGracefulDegradation = (): [DegradationState, DegradationActions] => {
  const [state, setState] = useState<DegradationState>({
    isElectronAvailable: false,
    isYtDlpAvailable: false,
    isFfmpegAvailable: false,
    isOnline: true,
    hasStorageAccess: false,
    hasFileSystemAccess: false,
  });

  // Check if we're running in Electron
  const checkElectronAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const isAvailable = !!(window.electronAPI);
      setState(prev => ({ ...prev, isElectronAvailable: isAvailable }));
      return isAvailable;
    } catch (error) {
      console.warn('Electron API not available:', error);
      setState(prev => ({ ...prev, isElectronAvailable: false }));
      return false;
    }
  }, []);

  // Check yt-dlp availability
  const checkYtDlpAvailability = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.electronAPI) {
        setState(prev => ({ ...prev, isYtDlpAvailable: false }));
        return false;
      }
      
      const isAvailable = await window.electronAPI.checkYtDlp();
      setState(prev => ({ ...prev, isYtDlpAvailable: isAvailable }));
      return isAvailable;
    } catch (error) {
      console.warn('yt-dlp check failed:', error);
      setState(prev => ({ ...prev, isYtDlpAvailable: false }));
      return false;
    }
  }, []);

  // Check ffmpeg availability
  const checkFfmpegAvailability = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.electronAPI) {
        setState(prev => ({ ...prev, isFfmpegAvailable: false }));
        return false;
      }
      
      const isAvailable = await window.electronAPI.checkFfmpeg();
      setState(prev => ({ ...prev, isFfmpegAvailable: isAvailable }));
      return isAvailable;
    } catch (error) {
      console.warn('ffmpeg check failed:', error);
      setState(prev => ({ ...prev, isFfmpegAvailable: false }));
      return false;
    }
  }, []);

  // Check online status
  const checkOnlineStatus = useCallback(async (): Promise<boolean> => {
    try {
      const isOnline = navigator.onLine;
      setState(prev => ({ ...prev, isOnline }));
      return isOnline;
    } catch (error) {
      console.warn('Online status check failed:', error);
      setState(prev => ({ ...prev, isOnline: false }));
      return false;
    }
  }, []);

  // Check storage access
  const checkStorageAccess = useCallback(async (): Promise<boolean> => {
    try {
      // Test localStorage access
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      setState(prev => ({ ...prev, hasStorageAccess: true }));
      return true;
    } catch (error) {
      console.warn('Storage access check failed:', error);
      setState(prev => ({ ...prev, hasStorageAccess: false }));
      return false;
    }
  }, []);

  // Check file system access (if available)
  const checkFileSystemAccess = useCallback(async (): Promise<boolean> => {
    try {
      // This is a basic check - in a real app, you might test actual file operations
      const hasAccess = 'showDirectoryPicker' in window || 'showOpenFilePicker' in window;
      setState(prev => ({ ...prev, hasFileSystemAccess: hasAccess }));
      return hasAccess;
    } catch (error) {
      console.warn('File system access check failed:', error);
      setState(prev => ({ ...prev, hasFileSystemAccess: false }));
      return false;
    }
  }, []);

  // Retry connection
  const retryConnection = useCallback(async (): Promise<void> => {
    console.log('Retrying connection...');
    
    // Check all availability in parallel
    await Promise.allSettled([
      checkElectronAvailability(),
      checkYtDlpAvailability(),
      checkFfmpegAvailability(),
      checkOnlineStatus(),
      checkStorageAccess(),
      checkFileSystemAccess(),
    ]);
  }, [checkElectronAvailability, checkYtDlpAvailability, checkFfmpegAvailability, checkOnlineStatus, checkStorageAccess, checkFileSystemAccess]);

  // Retry yt-dlp check
  const retryYtDlpCheck = useCallback(async (): Promise<boolean> => {
    console.log('Retrying yt-dlp check...');
    return await checkYtDlpAvailability();
  }, [checkYtDlpAvailability]);

  // Retry ffmpeg check
  const retryFfmpegCheck = useCallback(async (): Promise<boolean> => {
    console.log('Retrying ffmpeg check...');
    return await checkFfmpegAvailability();
  }, [checkFfmpegAvailability]);

  // Initialize checks on mount
  useEffect(() => {
    retryConnection();
  }, [retryConnection]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('App went online');
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      console.log('App went offline');
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const actions: DegradationActions = {
    retryConnection,
    retryYtDlpCheck,
    retryFfmpegCheck,
    checkOnlineStatus,
  };

  return [state, actions];
}; 