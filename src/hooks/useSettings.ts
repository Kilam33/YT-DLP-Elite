import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setSettings, updateSetting } from '../store/slices/settingsSlice';

export const useSettings = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.electronAPI?.getSettings();
        if (settings) {
          // Check if settings contain the old video-only format and clear to use default behavior
          if (settings.customYtDlpArgs && settings.customYtDlpArgs.includes('--format "best[ext=mp4]/best"')) {
            console.log('Detected old video-only format, clearing to use default quality selection');
            settings.customYtDlpArgs = '';
            // Save the updated settings
            await window.electronAPI?.saveSettings({ customYtDlpArgs: '' });
          }
          
          dispatch(setSettings(settings));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, [dispatch]);
}; 