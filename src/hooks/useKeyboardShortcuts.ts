import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveView } from '../store/slices/uiSlice';
import { openSettings } from '../store/slices/settingsSlice';
import { clearCompleted } from '../store/slices/downloadsSlice';

export const useKeyboardShortcuts = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            // Focus on URL input in DownloadsView
            dispatch(setActiveView('downloads'));
            // Focus will be handled by DownloadsView component
            break;
          case 's':
            event.preventDefault();
            dispatch(openSettings('general'));
            break;
          case 'q':
            event.preventDefault();
            dispatch(setActiveView('queue'));
            break;
          case 'h':
            event.preventDefault();
            dispatch(setActiveView('history'));
            break;
          case 'l':
            event.preventDefault();
            dispatch(setActiveView('logs'));
            break;
          case 'c':
            if (event.shiftKey) {
              event.preventDefault();
              dispatch(clearCompleted());
            }
            break;
          case 'd':
            event.preventDefault();
            dispatch(setActiveView('downloads'));
            break;
        }
      }

      // ESC to close modals
      if (event.key === 'Escape') {
        // This would be handled by individual modal components
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);
};