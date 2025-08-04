import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setActiveView } from '../store/slices/uiSlice';
import { clearCompleted } from '../store/slices/downloadsSlice';
import { openSettings } from '../store/slices/settingsSlice';
import toast from 'react-hot-toast';

// Enhanced keyboard shortcuts for better UX
export const useKeyboardShortcuts = () => {
  const dispatch = useDispatch();
  const activeView = useSelector((state: RootState) => state.ui.activeView);
  const downloads = useSelector((state: RootState) => state.downloads.items);
  const queue = useSelector((state: RootState) => state.queue.items);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case '1':
            event.preventDefault();
            dispatch(setActiveView('downloads'));
            toast.success('Switched to Downloads', { duration: 1000 });
            break;
          
          case '2':
            event.preventDefault();
            dispatch(setActiveView('queue'));
            toast.success('Switched to Queue', { duration: 1000 });
            break;
          
          case '3':
            event.preventDefault();
            dispatch(setActiveView('history'));
            toast.success('Switched to History', { duration: 1000 });
            break;
          
          case '4':
            event.preventDefault();
            dispatch(setActiveView('logs'));
            toast.success('Switched to Logs', { duration: 1000 });
            break;
          

          
          case 'o':
            event.preventDefault();
            // Open settings
            dispatch(openSettings('general'));
            toast.success('Settings opened', { duration: 1000 });
            break;
          
          case 'p':
            event.preventDefault();
            // Pause all active downloads
            const activeDownloads = downloads.filter(d => 
              d.status === 'downloading' || d.status === 'processing'
            );
            if (activeDownloads.length > 0) {
              activeDownloads.forEach(download => {
                window.electronAPI?.pauseDownload(download.id);
              });
              toast.success(`Paused ${activeDownloads.length} downloads`, { duration: 1000 });
            } else {
              toast.info('No active downloads to pause', { duration: 1000 });
            }
            break;
          
          case 'u':
            event.preventDefault();
            // Resume all paused downloads
            const pausedDownloads = downloads.filter(d => d.status === 'paused');
            if (pausedDownloads.length > 0) {
              pausedDownloads.forEach(download => {
                window.electronAPI?.resumeDownload(download.id);
              });
              toast.success(`Resumed ${pausedDownloads.length} downloads`, { duration: 1000 });
            } else {
              toast.info('No paused downloads to resume', { duration: 1000 });
            }
            break;
          
          case 'x':
            event.preventDefault();
            // Clear completed downloads
            const completedCount = downloads.filter(d => d.status === 'completed').length;
            if (completedCount > 0) {
              dispatch(clearCompleted());
              // Also clear from Electron storage
              window.electronAPI?.clearCompleted();
              toast.success(`Cleared ${completedCount} completed downloads`, { duration: 1000 });
            } else {
              toast.info('No completed downloads to clear', { duration: 1000 });
            }
            break;
          
          case 'r':
            event.preventDefault();
            // Retry failed downloads
            const failedDownloads = downloads.filter(d => d.status === 'error');
            if (failedDownloads.length > 0) {
              failedDownloads.forEach(download => {
                window.electronAPI?.retryDownload(download.id);
              });
              toast.success(`Retrying ${failedDownloads.length} failed downloads`, { duration: 1000 });
            } else {
              toast.info('No failed downloads to retry', { duration: 1000 });
            }
            break;
        }
      }

      // Function keys
      switch (event.key) {
        case 'F1':
          event.preventDefault();
          // Show help
          toast('Press Ctrl+1-4 to switch views, Ctrl+O for settings, Ctrl+P/U to pause/resume downloads', { duration: 3000 });
          break;
        
        case 'F5':
          event.preventDefault();
          // Refresh
          window.location.reload();
          break;
        
        case 'F11':
          event.preventDefault();
          // Toggle fullscreen
          if (window.electronAPI?.toggleFullscreen) {
            window.electronAPI.toggleFullscreen();
          }
          break;
      }

      // Navigation shortcuts
      switch (event.key) {
        case 'Escape':
          // Close modals or clear selection
          const modals = document.querySelectorAll('[data-testid="modal"]');
          if (modals.length > 0) {
            const closeButton = document.querySelector('[data-testid="modal-close"]') as HTMLElement;
            if (closeButton) {
              closeButton.click();
            }
          }
          break;
        
        case 'Tab':
          // Enhanced tab navigation
          if (event.shiftKey) {
            // Navigate backwards through focusable elements
            const focusableElements = document.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const currentIndex = Array.from(focusableElements).findIndex(el => el === document.activeElement);
            if (currentIndex > 0) {
              (focusableElements[currentIndex - 1] as HTMLElement).focus();
            }
          }
          break;
      }

      // Download management shortcuts
      if (activeView === 'downloads') {
        switch (event.key) {
          case 'ArrowUp':
          case 'ArrowDown':
            event.preventDefault();
            // Navigate through download cards
            const downloadCards = document.querySelectorAll('[data-testid="download-card"]');
            const currentIndex = Array.from(downloadCards).findIndex(el => el === document.activeElement);
            if (currentIndex >= 0) {
              const nextIndex = event.key === 'ArrowDown' 
                ? Math.min(currentIndex + 1, downloadCards.length - 1)
                : Math.max(currentIndex - 1, 0);
              (downloadCards[nextIndex] as HTMLElement).focus();
            }
            break;
          
          case 'Enter':
            event.preventDefault();
            // Open metadata for selected download
            const selectedCard = document.querySelector('[data-testid="download-card"]:focus') as HTMLElement;
            if (selectedCard) {
              const metadataButton = selectedCard.querySelector('[data-testid="metadata-button"]') as HTMLElement;
              if (metadataButton) {
                metadataButton.click();
              }
            }
            break;
          
          case 'Delete':
            event.preventDefault();
            // Remove selected download
            const focusedCard = document.querySelector('[data-testid="download-card"]:focus') as HTMLElement;
            if (focusedCard) {
              const removeButton = focusedCard.querySelector('[data-testid="remove-button"]') as HTMLElement;
              if (removeButton) {
                removeButton.click();
              }
            }
            break;
        }
      }

      // Queue management shortcuts
      if (activeView === 'queue') {
        switch (event.key) {
          case 'ArrowUp':
          case 'ArrowDown':
            event.preventDefault();
            // Navigate through queue items
            const queueItems = document.querySelectorAll('[data-testid="queue-item"]');
            const currentIndex = Array.from(queueItems).findIndex(el => el === document.activeElement);
            if (currentIndex >= 0) {
              const nextIndex = event.key === 'ArrowDown' 
                ? Math.min(currentIndex + 1, queueItems.length - 1)
                : Math.max(currentIndex - 1, 0);
              (queueItems[nextIndex] as HTMLElement).focus();
            }
            break;
          
          case 'Delete':
            event.preventDefault();
            // Remove selected queue item
            const focusedItem = document.querySelector('[data-testid="queue-item"]:focus') as HTMLElement;
            if (focusedItem) {
              const removeButton = focusedItem.querySelector('[data-testid="remove-queue-item"]') as HTMLElement;
              if (removeButton) {
                removeButton.click();
              }
            }
            break;
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, activeView, downloads, queue]);

  // Return shortcut info for help display
  const getShortcuts = () => ({
    navigation: {
      'Ctrl+1': 'Downloads',
      'Ctrl+2': 'Queue', 
      'Ctrl+3': 'History',
      'Ctrl+4': 'Logs',
      'Ctrl+O': 'Settings',
      'Ctrl+R': 'Retry Failed',
      'Esc': 'Close Modal',
      'F1': 'Help',
      'F5': 'Refresh',
      'F11': 'Fullscreen'
    },
    downloads: {
      '↑/↓': 'Navigate Downloads',
      'Enter': 'Open Metadata',
      'Delete': 'Remove Download',
      'Ctrl+P': 'Pause All',
      'Ctrl+U': 'Resume All',
      'Ctrl+X': 'Clear Completed'
    },
    queue: {
      '↑/↓': 'Navigate Queue',
      'Delete': 'Remove Item'
    }
  });

  return { getShortcuts };
};