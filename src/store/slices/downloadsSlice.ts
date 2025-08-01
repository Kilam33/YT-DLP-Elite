import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
}

const initialState: DownloadsState = {
  items: [],
  filter: 'all',
  searchQuery: '',
  selectedIds: [],
};

const downloadsSlice = createSlice({
  name: 'downloads',
  initialState,
  reducers: {
    setDownloads: (state, action: PayloadAction<Download[]>) => {
      state.items = action.payload;
    },
    addDownload: (state, action: PayloadAction<Download>) => {
      state.items.push(action.payload);
    },
    updateDownload: (state, action: PayloadAction<Download>) => {
      const index = state.items.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeDownload: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(d => d.id !== action.payload);
    },
    clearCompleted: (state) => {
      state.items = state.items.filter(d => 
        d.status !== 'completed' && d.status !== 'error'
      );
    },
    setFilter: (state, action: PayloadAction<DownloadsState['filter']>) => {
      state.filter = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
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
  removeDownload,
  clearCompleted,
  setFilter,
  setSearchQuery,
  toggleSelection,
  clearSelection,
  selectAll,
} = downloadsSlice.actions;

export default downloadsSlice.reducer;