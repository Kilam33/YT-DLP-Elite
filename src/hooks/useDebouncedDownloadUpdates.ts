import { useCallback, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useDispatch } from 'react-redux';
import { updateDownload, updateMultipleDownloads } from '../store/slices/downloadsSlice';

interface DownloadUpdate {
  id: string;
  progress?: number;
  speed?: number;
  eta?: number | null;
  downloaded?: number;
  filesize?: number;
  status?: string;
  filename?: string;
  error?: string | null;
}

/**
 * Custom hook for debounced download updates to reduce Redux re-renders
 * Batches multiple updates for the same download into a single Redux action
 */
export const useDebouncedDownloadUpdates = () => {
  const dispatch = useDispatch();
  const pendingUpdates = useRef<Map<string, DownloadUpdate>>(new Map());

  // Debounced function to flush pending updates
  const flushUpdates = useDebouncedCallback(() => {
    const updates = Array.from(pendingUpdates.current.values());
    pendingUpdates.current.clear();

    // Performance optimization: Use batch update for multiple downloads
    if (updates.length > 1) {
      dispatch(updateMultipleDownloads(updates as any));
    } else if (updates.length === 1) {
      dispatch(updateDownload(updates[0] as any));
    }
  }, 100); // Reduced to 100ms for more responsive progress updates

  // Function to queue a download update
  const queueUpdate = useCallback((update: DownloadUpdate) => {
    const existing = pendingUpdates.current.get(update.id);
    
    if (existing) {
      // Merge with existing update
      pendingUpdates.current.set(update.id, {
        ...existing,
        ...update,
        // For progress updates, always use the latest value
        ...(update.progress !== undefined && { progress: update.progress }),
        ...(update.speed !== undefined && { speed: update.speed }),
        ...(update.eta !== undefined && { eta: update.eta }),
        ...(update.downloaded !== undefined && { downloaded: update.downloaded }),
        ...(update.filesize !== undefined && { filesize: update.filesize }),
        ...(update.status !== undefined && { status: update.status }),
        ...(update.filename !== undefined && { filename: update.filename }),
        ...(update.error !== undefined && { error: update.error }),
      });
    } else {
      // Add new update
      pendingUpdates.current.set(update.id, update);
    }

    // Trigger debounced flush
    flushUpdates();
    
    // Force flush for progress updates to ensure real-time feedback
    if (update.progress !== undefined && update.progress > 0) {
      setTimeout(() => {
        flushUpdates.flush();
      }, 50); // Force flush after 50ms for progress updates
    }
  }, [flushUpdates]);

  // Function to immediately flush updates (for status changes)
  const flushImmediately = useCallback(() => {
    flushUpdates.flush();
  }, [flushUpdates]);

  return {
    queueUpdate,
    flushImmediately,
  };
}; 