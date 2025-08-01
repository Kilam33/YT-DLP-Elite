import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { closeSettings, setActiveTab, updateSetting } from '../store/slices/settingsSlice';
import { X, Settings, Download, Keyboard, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsModal: React.FC = () => {
  const dispatch = useDispatch();
  const { isOpen, activeTab, data: settings } = useSelector((state: RootState) => state.settings);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  ];

  const handleSelectFolder = async () => {
    try {
      const folder = await window.electronAPI?.selectFolder();
      if (folder) {
        dispatch(updateSetting({ key: 'outputPath', value: folder }));
        // Save settings after updating
        await window.electronAPI?.saveSettings({ outputPath: folder });
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
    dispatch(updateSetting({ key, value }));
    // Save settings after updating
    await window.electronAPI?.saveSettings({ [key]: value });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white">Settings</h2>
            <button
              onClick={() => dispatch(closeSettings())}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex h-[calc(80vh-80px)]">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-700/50 p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => dispatch(setActiveTab(tab.id))}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left
                        ${isActive 
                          ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30' 
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Maximum Concurrent Downloads
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={settings.maxConcurrentDownloads}
                        onChange={(e) => handleSettingChange('maxConcurrentDownloads', parseInt(e.target.value))}
                        className="w-24 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Retry Attempts
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={settings.retryAttempts}
                        onChange={(e) => handleSettingChange('retryAttempts', parseInt(e.target.value))}
                        className="w-24 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500"
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoStart"
                        checked={settings.autoStartDownloads}
                        onChange={(e) => handleSettingChange('autoStartDownloads', e.target.checked)}
                        className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                      />
                      <label htmlFor="autoStart" className="text-white/80">
                        Auto-start downloads when added
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'downloads' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Download Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Default Output Path
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={settings.outputPath}
                          onChange={(e) => handleSettingChange('outputPath', e.target.value)}
                          placeholder="Select download folder..."
                          className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-lime-500"
                        />
                        <button
                          onClick={handleSelectFolder}
                          className="px-4 py-2 bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 border border-lime-500/30 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <FolderOpen className="w-4 h-4" />
                          <span>Browse</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Default Quality
                      </label>
                      <select
                        value={settings.qualityPreset}
                        onChange={(e) => handleSettingChange('qualityPreset', e.target.value)}
                        className="w-48 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500"
                      >
                        <option value="best">Best Quality</option>
                        <option value="1080p">1080p</option>
                        <option value="720p">720p</option>
                        <option value="480p">480p</option>
                        <option value="audio">Audio Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Download Speed Limit (KB/s, 0 = unlimited)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings.downloadSpeed}
                        onChange={(e) => handleSettingChange('downloadSpeed', parseInt(e.target.value))}
                        className="w-32 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        File Naming Template
                      </label>
                      <input
                        type="text"
                        value={settings.fileNamingTemplate}
                        onChange={(e) => handleSettingChange('fileNamingTemplate', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500"
                      />
                      <p className="text-xs text-white/50 mt-1">
                        Use yt-dlp format strings like %(title)s, %(uploader)s, %(upload_date)s
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Custom yt-dlp Arguments
                      </label>
                      <textarea
                        value={settings.customYtDlpArgs}
                        onChange={(e) => handleSettingChange('customYtDlpArgs', e.target.value)}
                        placeholder="--write-subs --embed-subs"
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-lime-500 h-20 resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-white/90">Additional Options</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="keepOriginal"
                            checked={settings.keepOriginalFiles}
                            onChange={(e) => handleSettingChange('keepOriginalFiles', e.target.checked)}
                            className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                          />
                          <label htmlFor="keepOriginal" className="text-white/80 text-sm">
                            Keep original files
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="writeSubtitles"
                            checked={settings.writeSubtitles}
                            onChange={(e) => handleSettingChange('writeSubtitles', e.target.checked)}
                            className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                          />
                          <label htmlFor="writeSubtitles" className="text-white/80 text-sm">
                            Write subtitles
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="embedSubtitles"
                            checked={settings.embedSubtitles}
                            onChange={(e) => handleSettingChange('embedSubtitles', e.target.checked)}
                            className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                          />
                          <label htmlFor="embedSubtitles" className="text-white/80 text-sm">
                            Embed subtitles
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="writeThumbnail"
                            checked={settings.writeThumbnail}
                            onChange={(e) => handleSettingChange('writeThumbnail', e.target.checked)}
                            className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                          />
                          <label htmlFor="writeThumbnail" className="text-white/80 text-sm">
                            Write thumbnail
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="writeDescription"
                            checked={settings.writeDescription}
                            onChange={(e) => handleSettingChange('writeDescription', e.target.checked)}
                            className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                          />
                          <label htmlFor="writeDescription" className="text-white/80 text-sm">
                            Write description
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="writeInfoJson"
                            checked={settings.writeInfoJson}
                            onChange={(e) => handleSettingChange('writeInfoJson', e.target.checked)}
                            className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                          />
                          <label htmlFor="writeInfoJson" className="text-white/80 text-sm">
                            Write info.json
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'shortcuts' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Keyboard Shortcuts</h3>
                  
                  <div className="space-y-3">
                    {[
                      { action: 'Add Download', shortcut: 'Ctrl+N' },
                      { action: 'Settings', shortcut: 'Ctrl+S' },
                      { action: 'Queue View', shortcut: 'Ctrl+Q' },
                      { action: 'History View', shortcut: 'Ctrl+H' },
                      { action: 'Logs View', shortcut: 'Ctrl+L' },
                      { action: 'Pause All', shortcut: 'Ctrl+P' },
                      { action: 'Clear Completed', shortcut: 'Ctrl+C' },
                      { action: 'Retry Failed', shortcut: 'Ctrl+R' },
                    ].map(({ action, shortcut }) => (
                      <div key={action} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <span className="text-white/80">{action}</span>
                        <kbd className="px-2 py-1 bg-slate-600/50 border border-slate-500/50 rounded text-xs text-white/70">
                          {shortcut}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SettingsModal;