import { Middleware } from '@reduxjs/toolkit';
import { markSaved, selectIsDirty, selectLastSaved } from '../slices/downloadsSlice';

const STORAGE_KEY = 'yt-dlp-downloads';
const SAVE_INTERVAL = 5000; // Save every 5 seconds if dirty
const MAX_SAVE_INTERVAL = 30000; // Force save every 30 seconds

let saveTimeout: NodeJS.Timeout | null = null;
let lastSaveTime = 0;

export const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Check if the action affects downloads state
  const isDownloadAction = action.type?.startsWith('downloads/');
  
  if (isDownloadAction) {
    const state = store.getState();
    const isDirty = selectIsDirty(state);
    const lastSaved = selectLastSaved(state);
    const now = Date.now();
    
    // Schedule save if state is dirty
    if (isDirty) {
      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      // Calculate delay for next save
      const timeSinceLastSave = now - lastSaved;
      const delay = Math.min(
        Math.max(SAVE_INTERVAL, MAX_SAVE_INTERVAL - timeSinceLastSave),
        MAX_SAVE_INTERVAL
      );
      
      saveTimeout = setTimeout(() => {
        saveDownloadsToStorage(store.getState());
        store.dispatch(markSaved());
        lastSaveTime = now;
      }, delay);
    }
  }
  
  return result;
};

// Save downloads to localStorage
const saveDownloadsToStorage = (state: any) => {
  try {
    const downloadsData = {
      items: state.downloads.items,
      timestamp: Date.now(),
      version: '1.0.0', // For future migrations
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(downloadsData));
    console.log(`Saved ${state.downloads.items.length} downloads to storage`);
  } catch (error) {
    console.error('Failed to save downloads to storage:', error);
  }
};

// Load downloads from localStorage
export const loadDownloadsFromStorage = (): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    
    const data = JSON.parse(stored);
    
    // Validate data structure
    if (!data.items || !Array.isArray(data.items)) {
      console.warn('Invalid downloads data in storage, clearing...');
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    
    // Filter out old completed downloads (older than 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filteredItems = data.items.filter((download: any) => {
      if (download.status === 'completed' || download.status === 'error') {
        const completedAt = download.completedAt ? new Date(download.completedAt).getTime() : 0;
        return completedAt > thirtyDaysAgo;
      }
      return true;
    });
    
    console.log(`Loaded ${filteredItems.length} downloads from storage`);
    return filteredItems;
  } catch (error) {
    console.error('Failed to load downloads from storage:', error);
    return [];
  }
};

// Clear all stored downloads
export const clearDownloadsFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Cleared downloads from storage');
  } catch (error) {
    console.error('Failed to clear downloads from storage:', error);
  }
};

// Get storage statistics
export const getStorageStats = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { size: 0, itemCount: 0 };
    }
    
    const data = JSON.parse(stored);
    return {
      size: stored.length,
      itemCount: data.items?.length || 0,
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return { size: 0, itemCount: 0 };
  }
}; 