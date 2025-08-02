import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  activeView: 'downloads' | 'queue' | 'history' | 'logs';
  sidebarCollapsed: boolean;
  isMetadataModalOpen: boolean;
  selectedMetadata: any;
  logs: Array<{
    id: string;
    timestamp: string; // ISO string instead of Date
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    downloadId?: string;
    source?: string;
    data?: any;
  }>;
  logFilter: 'all' | 'info' | 'warning' | 'error' | 'debug';
}

const initialState: UiState = {
  activeView: 'downloads',
  sidebarCollapsed: false,
  isMetadataModalOpen: false,
  selectedMetadata: null,
  logs: [],
  logFilter: 'all',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveView: (state, action: PayloadAction<UiState['activeView']>) => {
      state.activeView = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    openMetadataModal: (state, action: PayloadAction<any>) => {
      state.isMetadataModalOpen = true;
      state.selectedMetadata = action.payload;
    },
    closeMetadataModal: (state) => {
      state.isMetadataModalOpen = false;
      state.selectedMetadata = null;
    },
    addLog: (state, action: PayloadAction<Omit<UiState['logs'][0], 'id' | 'timestamp'>>) => {
      const log = {
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(), // Store as ISO string
      };
      state.logs.unshift(log);
      
      // Keep only last 500 logs to reduce memory usage
      if (state.logs.length > 500) {
        state.logs = state.logs.slice(0, 500);
      }
    },
    clearLogs: (state) => {
      state.logs = [];
    },
    setLogFilter: (state, action: PayloadAction<UiState['logFilter']>) => {
      state.logFilter = action.payload;
    },
  },
});

export const {
  setActiveView,
  toggleSidebar,
  setSidebarCollapsed,
  openMetadataModal,
  closeMetadataModal,
  addLog,
  clearLogs,
  setLogFilter,
} = uiSlice.actions;

export default uiSlice.reducer;