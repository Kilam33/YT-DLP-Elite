import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface QueueState {
  items: string[];
  isProcessing: boolean;
}

const initialState: QueueState = {
  items: [],
  isProcessing: false,
};

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    setQueue: (state, action: PayloadAction<string[]>) => {
      state.items = action.payload;
    },
    addToQueue: (state, action: PayloadAction<string>) => {
      if (!state.items.includes(action.payload)) {
        state.items.push(action.payload);
      }
    },
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(id => id !== action.payload);
    },
    reorderQueue: (state, action: PayloadAction<{ from: number; to: number }>) => {
      const { from, to } = action.payload;
      const [movedItem] = state.items.splice(from, 1);
      state.items.splice(to, 0, movedItem);
    },
    clearQueue: (state) => {
      state.items = [];
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
  },
});

export const {
  setQueue,
  addToQueue,
  removeFromQueue,
  reorderQueue,
  clearQueue,
  setProcessing,
} = queueSlice.actions;

export default queueSlice.reducer;