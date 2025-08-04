import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';

export interface Download {
  id: string;
  url: string;
  status: 'pending' | 'initializing' | 'connecting' | 'downloading' | 'processing' | 'completed' | 'error' | 'paused';
  progress: number;
  speed: number;
  eta: number | null;
  filename: string;
  filesize: number;
  downloaded: number;
  quality: string;
  outputPath: string;
  addedAt: string; // ISO string
  startedAt?: string; // ISO string
  completedAt?: string; // ISO string
  metadata: any;
  error: string | null;
  retryCount: number;
}

// Helper function to convert date string to Date object
export const parseDownloadDate = (dateString: string): Date => {
  return new Date(dateString);
};

// Helper function to format date for display
export const formatDownloadDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface DownloadsState {
  items: Download[];
  filter: 'all' | 'active' | 'completed' | 'failed';
  searchQuery: string;
  selectedIds: string[];
  // Performance optimization: Pagination support
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  // Performance optimization: Cached filtered results
  cachedFilteredItems: Download[];
  lastFilterUpdate: number;
  // Performance optimization: Persistence state
  lastSaved: number;
  isDirty: boolean;
}

const initialState: DownloadsState = {
  items: [],
  filter: 'all',
  searchQuery: '',
  selectedIds: [],
  pagination: {
    currentPage: 1,
    pageSize: 50, // Load 50 downloads at a time
    totalItems: 0,
    totalPages: 0,
  },
  cachedFilteredItems: [],
  lastFilterUpdate: 0,
  lastSaved: 0,
  isDirty: false,
};

// Performance optimization: Memoized filtering function
const getFilteredItems = (items: Download[], filter: string, searchQuery: string): Download[] => {
  let filtered = items;
  
  // Apply status filter
  if (filter !== 'all') {
    filtered = items.filter(download => {
      switch (filter) {
        case 'active':
          return ['pending', 'initializing', 'connecting', 'downloading', 'processing', 'paused'].includes(download.status);
        case 'completed':
          return download.status === 'completed';
        case 'failed':
          return download.status === 'error';
        default:
          return true;
      }
    });
  }
  
  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(download => 
      download.url.toLowerCase().includes(query) ||
      download.filename.toLowerCase().includes(query) ||
      (download.metadata?.title && download.metadata.title.toLowerCase().includes(query))
    );
  }
  
  return filtered;
};

// Performance optimization: Get paginated items
const getPaginatedItems = (items: Download[], page: number, pageSize: number): Download[] => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return items.slice(startIndex, endIndex);
};

// Performance optimization: Mark state as dirty for persistence
const markDirty = (state: DownloadsState) => {
  state.isDirty = true;
  state.lastSaved = Date.now();
};

const downloadsSlice = createSlice({
  name: 'downloads',
  initialState,
  reducers: {
    setDownloads: (state, action: PayloadAction<Download[]>) => {
      state.items = action.payload;
      state.pagination.totalItems = action.payload.length;
      state.pagination.totalPages = Math.ceil(action.payload.length / state.pagination.pageSize);
      // Reset cache when all downloads are set
      state.cachedFilteredItems = [];
      state.lastFilterUpdate = 0;
      // Mark as dirty for persistence
      markDirty(state);
    },
    addDownload: (state, action: PayloadAction<Download>) => {
      state.items.push(action.payload);
      state.pagination.totalItems = state.items.length;
      state.pagination.totalPages = Math.ceil(state.items.length / state.pagination.pageSize);
      // Invalidate cache
      state.cachedFilteredItems = [];
      state.lastFilterUpdate = 0;
      // Mark as dirty for persistence
      markDirty(state);
    },
    // Performance optimization: Immutable update with structural sharing
    updateDownload: (state, action: PayloadAction<Download>) => {
      const index = state.items.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        // Only update changed fields to minimize re-renders
        const existingDownload = state.items[index];
        const updatedDownload = action.payload;
        
        // Check if any fields actually changed
        const hasChanges = 
          existingDownload.status !== updatedDownload.status ||
          existingDownload.progress !== updatedDownload.progress ||
          existingDownload.speed !== updatedDownload.speed ||
          existingDownload.eta !== updatedDownload.eta ||
          existingDownload.downloaded !== updatedDownload.downloaded ||
          existingDownload.filesize !== updatedDownload.filesize ||
          existingDownload.filename !== updatedDownload.filename ||
          existingDownload.error !== updatedDownload.error ||
          existingDownload.retryCount !== updatedDownload.retryCount;
        
        if (hasChanges) {
          // Create new object only if there are actual changes
          state.items[index] = {
            ...existingDownload,
            ...updatedDownload,
            // Preserve existing metadata if not provided in update
            metadata: updatedDownload.metadata || existingDownload.metadata,
          };
          
          // Invalidate cache when download is updated
          state.cachedFilteredItems = [];
          state.lastFilterUpdate = 0;
          
          // Mark as dirty for persistence
          markDirty(state);
        }
      }
    },
    // Performance optimization: Batch update multiple downloads
    updateMultipleDownloads: (state, action: PayloadAction<Download[]>) => {
      const updates = action.payload;
      const updateMap = new Map(updates.map(d => [d.id, d]));
      
      state.items = state.items.map(download => {
        const update = updateMap.get(download.id);
        if (update) {
          // Only update if there are actual changes
          const hasChanges = 
            download.status !== update.status ||
            download.progress !== update.progress ||
            download.speed !== update.speed ||
            download.eta !== update.eta ||
            download.downloaded !== update.downloaded ||
            download.filesize !== update.filesize ||
            download.filename !== update.filename ||
            download.error !== update.error ||
            download.retryCount !== update.retryCount;
          
          if (hasChanges) {
            return {
              ...download,
              ...update,
              metadata: update.metadata || download.metadata,
            };
          }
        }
        return download;
      });
      
      // Invalidate cache when multiple downloads are updated
      state.cachedFilteredItems = [];
      state.lastFilterUpdate = 0;
      
      // Mark as dirty for persistence
      markDirty(state);
    },
    removeDownload: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(d => d.id !== action.payload);
      state.pagination.totalItems = state.items.length;
      state.pagination.totalPages = Math.ceil(state.items.length / state.pagination.pageSize);
      // Invalidate cache
      state.cachedFilteredItems = [];
      state.lastFilterUpdate = 0;
      // Mark as dirty for persistence
      markDirty(state);
    },
    clearCompleted: (state) => {
      state.items = state.items.filter(d => 
        d.status !== 'completed' && d.status !== 'error'
      );
      state.pagination.totalItems = state.items.length;
      state.pagination.totalPages = Math.ceil(state.items.length / state.pagination.pageSize);
      // Invalidate cache
      state.cachedFilteredItems = [];
      state.lastFilterUpdate = 0;
      // Mark as dirty for persistence
      markDirty(state);
    },
    setFilter: (state, action: PayloadAction<DownloadsState['filter']>) => {
      state.filter = action.payload;
      state.pagination.currentPage = 1; // Reset to first page when filter changes
      // Invalidate cache
      state.cachedFilteredItems = [];
      state.lastFilterUpdate = 0;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.pagination.currentPage = 1; // Reset to first page when search changes
      // Invalidate cache
      state.cachedFilteredItems = [];
      state.lastFilterUpdate = 0;
    },
    // Performance optimization: Pagination actions
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload;
      state.pagination.totalPages = Math.ceil(state.pagination.totalItems / action.payload);
      state.pagination.currentPage = 1; // Reset to first page when page size changes
      // Invalidate cache
      state.cachedFilteredItems = [];
      state.lastFilterUpdate = 0;
    },
    // Performance optimization: Cache management
    invalidateCache: (state) => {
      state.cachedFilteredItems = [];
      state.lastFilterUpdate = 0;
    },
    // Performance optimization: Persistence actions
    markSaved: (state) => {
      state.isDirty = false;
      state.lastSaved = Date.now();
    },
    toggleSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter(selectedId => selectedId !== id);
      } else {
        state.selectedIds.push(id);
      }
    },
    clearSelection: (state) => {
      state.selectedIds = [];
    },
    selectAll: (state) => {
      state.selectedIds = state.items.map(d => d.id);
    },
  },
});

export const {
  setDownloads,
  addDownload,
  updateDownload,
  updateMultipleDownloads,
  removeDownload,
  clearCompleted,
  setFilter,
  setSearchQuery,
  setCurrentPage,
  setPageSize,
  invalidateCache,
  markSaved,
  toggleSelection,
  clearSelection,
  selectAll,
} = downloadsSlice.actions;

// Performance optimization: Memoized selectors for paginated data
export const selectFilteredItems = createSelector(
  [(state: { downloads: DownloadsState }) => state.downloads.items,
   (state: { downloads: DownloadsState }) => state.downloads.filter,
   (state: { downloads: DownloadsState }) => state.downloads.searchQuery,
   (state: { downloads: DownloadsState }) => state.downloads.cachedFilteredItems,
   (state: { downloads: DownloadsState }) => state.downloads.lastFilterUpdate],
  (items, filter, searchQuery, cachedFilteredItems, lastFilterUpdate) => {
    const now = Date.now();
    
    // Use cache if it's less than 5 seconds old
    if (cachedFilteredItems.length > 0 && (now - lastFilterUpdate) < 5000) {
      return cachedFilteredItems;
    }
    
    // Calculate filtered items
    return getFilteredItems(items, filter, searchQuery);
  }
);

export const selectPaginatedItems = createSelector(
  [selectFilteredItems,
   (state: { downloads: DownloadsState }) => state.downloads.pagination.currentPage,
   (state: { downloads: DownloadsState }) => state.downloads.pagination.pageSize],
  (filteredItems, currentPage, pageSize) => {
    return getPaginatedItems(filteredItems, currentPage, pageSize);
  }
);

export const selectPaginationInfo = createSelector(
  [selectFilteredItems,
   (state: { downloads: DownloadsState }) => state.downloads.pagination],
  (filteredItems, pagination) => {
    return {
      ...pagination,
      totalItems: filteredItems.length,
      totalPages: Math.ceil(filteredItems.length / pagination.pageSize),
    };
  }
);

// Performance optimization: Persistence selectors
export const selectIsDirty = (state: { downloads: DownloadsState }) => state.downloads.isDirty;
export const selectLastSaved = (state: { downloads: DownloadsState }) => state.downloads.lastSaved;

export default downloadsSlice.reducer;