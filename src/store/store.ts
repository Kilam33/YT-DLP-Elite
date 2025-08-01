import { configureStore } from '@reduxjs/toolkit';
import downloadsReducer from './slices/downloadsSlice';
import queueReducer from './slices/queueSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    downloads: downloadsReducer,
    queue: queueReducer,
    settings: settingsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['downloads/updateDownload'],
        ignoredPaths: [
          'downloads.items.*.addedAt', 
          'downloads.items.*.startedAt', 
          'downloads.items.*.completedAt'
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;