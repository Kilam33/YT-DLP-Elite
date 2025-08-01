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