import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setActiveView } from '../store/slices/uiSlice';
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
          
          case 'n':
            event.preventDefault();
            // Focus URL input (if available)
            const urlInput = document.querySelector('input[placeholder*="URL"]') as HTMLInputElement;
            if (urlInput) {
              urlInput.focus();
              urlInput.select();
            }
            toast.success('Focus URL input', { duration: 1000 });
            break;
          
          case 's':
            event.preventDefault();
            // Open settings
            const settingsButton = document.querySelector('[data-testid="settings-button"]') as HTMLElement;
            if (settingsButton) {
              settingsButton.click();
            }
            toast.success('Open Settings', { duration: 1000 });
            break;
          
          case 'r':
            event.preventDefault();
            // Refresh current view
            window.location.reload();
            break;
          
          case 'p':
            event.preventDefault();
            // Pause all downloads
            const pauseButtons = document.querySelectorAll('[data-testid="pause-button"]');
            pauseButtons.forEach(button => (button as HTMLElement).click());
            toast.success('Paused all downloads', { duration: 1000 });
            break;
          
          case 'u':
            event.preventDefault();
            // Resume all downloads
            const resumeButtons = document.querySelectorAll('[data-testid="resume-button"]');
            resumeButtons.forEach(button => (button as HTMLElement).click());
            toast.success('Resumed all downloads', { duration: 1000 });
            break;
          
          case 'c':
            event.preventDefault();
            // Clear completed downloads
            const clearButton = document.querySelector('[data-testid="clear-completed"]') as HTMLElement;
            if (clearButton) {
              clearButton.click();
            }
            toast.success('Clear completed downloads', { duration: 1000 });
            break;
        }
      }

      // Function keys
      switch (event.key) {
        case 'F1':
          event.preventDefault();
          // Show help
          toast('Press Ctrl+1-4 to switch views, Ctrl+N for new download', { duration: 3000 });
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
      'Ctrl+N': 'New Download',
      'Ctrl+S': 'Settings',
      'Ctrl+R': 'Refresh',
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
      'Ctrl+C': 'Clear Completed'
    },
    queue: {
      '↑/↓': 'Navigate Queue',
      'Delete': 'Remove Item'
    }
  });

  return { getShortcuts };
};