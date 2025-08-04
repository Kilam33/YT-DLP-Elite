import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { closeSettings, setActiveTab, updateSetting } from '../store/slices/settingsSlice';
import { X, Settings, Download, Keyboard, FolderOpen, ChevronDown, ChevronRight, Network, Shield, FileText, Bug, Clock, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const SettingsModal: React.FC = () => {
  const dispatch = useDispatch();
  const { isOpen, activeTab, data: settings } = useSelector((state: RootState) => state.settings);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(['basic']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

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

  const handleSelectCookiesFile = async () => {
    try {
      const result = await window.electronAPI?.selectFile([{ name: 'Cookies Files', extensions: ['txt', 'cookies'] }]);
      if (result) {
        dispatch(updateSetting({ key: 'cookiesFilePath', value: result }));
        await window.electronAPI?.saveSettings({ cookiesFilePath: result });
      }
    } catch (error) {
      console.error('Failed to select cookies file:', error);
    }
  };

  const handleSelectLogsDirectory = async () => {
    try {
      const folder = await window.electronAPI?.selectFolder();
      if (folder) {
        dispatch(updateSetting({ key: 'logsDirectory', value: folder }));
        await window.electronAPI?.saveSettings({ logsDirectory: folder });
      }
    } catch (error) {
      console.error('Failed to select logs directory:', error);
    }
  };

  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
    dispatch(updateSetting({ key, value }));
    // Save settings after updating
    await window.electronAPI?.saveSettings({ [key]: value });
  };

  const handleSaveAllSettings = async () => {
    try {
      // Save all current settings to the main process
      await window.electronAPI?.saveSettings(settings);
      // Show success feedback
      toast.success('Settings saved successfully');
      // Close the modal after successful save
      dispatch(closeSettings());
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleVerifySettings = async () => {
    try {
      const currentSettings = await window.electronAPI?.getSettings();
      console.log('Current settings from main process:', currentSettings);
      toast.success('Settings verified - check console for details');
    } catch (error) {
      console.error('Failed to verify settings:', error);
      toast.error('Failed to verify settings');
    }
  };

  const handleResetToDefaults = async () => {
    try {
      const defaultSettings = {
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
        verboseLogging: false,
        queueProcessingDelay: 1000,
        maxRetriesPerDownload: 3,
        autoRetryFailed: false,
        maxFileSize: 0,
        skipExistingFiles: true,
        createSubdirectories: false,
        connectionTimeout: 30,
        socketTimeout: 60,
        maxDownloadsPerHour: 0,
        useCookies: false,
        cookiesFilePath: '',
        userAgent: '',
        useProxy: false,
        proxyUrl: '',
        proxyUsername: '',
        proxyPassword: '',
        extractAudioFormat: 'mp3',
        videoFormat: 'mp4',
        audioQuality: 'best',
        videoQuality: 'best',
        writePlaylistInfo: false,
        writeAnnotations: false,
        writeComments: false,
        postProcessors: '',
        mergeVideoFormats: true,
        preferFreeFormats: true,
        enableDebugMode: false,
        logLevel: 'info',
        saveLogsToFile: false,
        logsDirectory: '',
      };
      
      // Update Redux store
      Object.entries(defaultSettings).forEach(([key, value]) => {
        dispatch(updateSetting({ key: key as keyof typeof settings, value }));
      });
      
      // Save to main process
      await window.electronAPI?.saveSettings(defaultSettings);
      toast.success('Settings reset to defaults');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast.error('Failed to reset settings');
    }
  };

  const handleExportSettings = () => {
    try {
      const settingsData = JSON.stringify(settings, null, 2);
      const blob = new Blob([settingsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yt-dlp-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Settings exported successfully');
    } catch (error) {
      console.error('Failed to export settings:', error);
      toast.error('Failed to export settings');
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        
        // Update Redux store
        Object.entries(importedSettings).forEach(([key, value]) => {
          dispatch(updateSetting({ key: key as keyof typeof settings, value }));
        });
        
        // Save to main process
        await window.electronAPI?.saveSettings(importedSettings);
        toast.success('Settings imported successfully');
      } catch (error) {
        console.error('Failed to import settings:', error);
        toast.error('Failed to import settings');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-lime-400" />
              <div>
                <h2 className="text-xl font-bold text-white">Settings</h2>
                <p className="text-white/60 text-sm">Configure application preferences and download options</p>
              </div>
            </div>
            <button
              onClick={() => dispatch(closeSettings())}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex h-[calc(80vh-80px)]">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-700/50 p-4 flex flex-col pb-8">
              <nav className="space-y-1 flex-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => dispatch(setActiveTab(tab.id))}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-left
                        ${isActive 
                          ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30 shadow-lg' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{tab.label}</span>
                    </motion.button>
                  );
                })}
              </nav>
              
              {/* Action Buttons - Inside sidebar below tabs */}
              <div className="pt-20 border-t border-slate-700/50 mt-4 space-y-2">
                <button
                  onClick={handleSaveAllSettings}
                  className="w-full px-4 py-2 bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 hover:text-lime-300 border border-lime-500/30 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Save Settings
                </button>
                <button
                  onClick={() => dispatch(closeSettings())}
                  className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white/80 hover:text-white border border-slate-600/50 rounded-lg transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 preset-scrollbar">
              {activeTab === 'general' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <Settings className="w-5 h-5 text-lime-400" />
                    <h3 className="text-lg font-semibold text-white">General Settings</h3>
                  </div>
                  
                  {/* Basic Settings Section */}
                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleSection('basic')}
                      className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors w-full p-3 rounded-lg hover:bg-slate-800/30"
                    >
                      {expandedSections.has('basic') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span className="font-medium">Basic Settings</span>
                    </motion.button>
                    
                    <AnimatePresence>
                      {expandedSections.has('basic') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pl-6 bg-slate-800/20 rounded-lg p-4 border border-slate-700/30"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
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
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Queue Management Section */}
                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleSection('queue')}
                      className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors w-full p-3 rounded-lg hover:bg-slate-800/30"
                    >
                      {expandedSections.has('queue') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Queue Management</span>
                    </motion.button>
                    
                    <AnimatePresence>
                      {expandedSections.has('queue') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pl-6 bg-slate-800/20 rounded-lg p-4 border border-slate-700/30"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-white/80 mb-2">
                                Queue Processing Delay (ms)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10000"
                                value={settings.queueProcessingDelay}
                                onChange={(e) => handleSettingChange('queueProcessingDelay', parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
                              />
                              <p className="text-xs text-white/50 mt-1">Delay between starting downloads</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-white/80 mb-2">
                                Max Retries Per Download
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={settings.maxRetriesPerDownload}
                                onChange={(e) => handleSettingChange('maxRetriesPerDownload', parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                            <input
                              type="checkbox"
                              id="autoRetry"
                              checked={settings.autoRetryFailed}
                              onChange={(e) => handleSettingChange('autoRetryFailed', e.target.checked)}
                              className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                            />
                            <label htmlFor="autoRetry" className="text-white/80">
                              Auto-retry failed downloads
                            </label>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* File Management Section */}
                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleSection('files')}
                      className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors w-full p-3 rounded-lg hover:bg-slate-800/30"
                    >
                      {expandedSections.has('files') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <HardDrive className="w-4 h-4" />
                      <span className="font-medium">File Management</span>
                    </motion.button>
                    
                    <AnimatePresence>
                      {expandedSections.has('files') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pl-6 bg-slate-800/20 rounded-lg p-4 border border-slate-700/30"
                        >
                          <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                              Maximum File Size (MB, 0 = unlimited)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={settings.maxFileSize}
                              onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                              <input
                                type="checkbox"
                                id="skipExisting"
                                checked={settings.skipExistingFiles}
                                onChange={(e) => handleSettingChange('skipExistingFiles', e.target.checked)}
                                className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                              />
                              <label htmlFor="skipExisting" className="text-white/80">
                                Skip existing files
                              </label>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                              <input
                                type="checkbox"
                                id="createSubdirs"
                                checked={settings.createSubdirectories}
                                onChange={(e) => handleSettingChange('createSubdirectories', e.target.checked)}
                                className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                              />
                              <label htmlFor="createSubdirs" className="text-white/80">
                                Create subdirectories for different content types
                              </label>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Network & Performance Section */}
                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleSection('network')}
                      className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors w-full p-3 rounded-lg hover:bg-slate-800/30"
                    >
                      {expandedSections.has('network') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <Network className="w-4 h-4" />
                      <span className="font-medium">Network & Performance</span>
                    </motion.button>
                    
                    <AnimatePresence>
                      {expandedSections.has('network') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pl-6 bg-slate-800/20 rounded-lg p-4 border border-slate-700/30"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-white/80 mb-2">
                                Connection Timeout (seconds)
                              </label>
                              <input
                                type="number"
                                min="5"
                                max="300"
                                value={settings.connectionTimeout}
                                onChange={(e) => handleSettingChange('connectionTimeout', parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-white/80 mb-2">
                                Socket Timeout (seconds)
                              </label>
                              <input
                                type="number"
                                min="10"
                                max="600"
                                value={settings.socketTimeout}
                                onChange={(e) => handleSettingChange('socketTimeout', parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-white/80 mb-2">
                                Max Downloads Per Hour (0 = unlimited)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={settings.maxDownloadsPerHour}
                                onChange={(e) => handleSettingChange('maxDownloadsPerHour', parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Authentication & Cookies Section */}
                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleSection('auth')}
                      className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors w-full p-3 rounded-lg hover:bg-slate-800/30"
                    >
                      {expandedSections.has('auth') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">Authentication & Cookies</span>
                    </motion.button>
                    
                    <AnimatePresence>
                      {expandedSections.has('auth') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pl-6 bg-slate-800/20 rounded-lg p-4 border border-slate-700/30"
                        >
                          <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                            <input
                              type="checkbox"
                              id="useCookies"
                              checked={settings.useCookies}
                              onChange={(e) => handleSettingChange('useCookies', e.target.checked)}
                              className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                            />
                            <label htmlFor="useCookies" className="text-white/80">
                              Use cookies for authentication
                            </label>
                          </div>

                          {settings.useCookies && (
                            <div>
                              <label className="block text-sm font-medium text-white/80 mb-2">
                                Cookies File Path
                              </label>
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  value={settings.cookiesFilePath}
                                  onChange={(e) => handleSettingChange('cookiesFilePath', e.target.value)}
                                  placeholder="Path to cookies file..."
                                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-lime-500 transition-colors"
                                />
                                <button
                                  onClick={handleSelectCookiesFile}
                                  className="px-4 py-2 bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 border border-lime-500/30 rounded-lg transition-colors"
                                >
                                  Browse
                                </button>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                              Custom User Agent
                            </label>
                            <input
                              type="text"
                              value={settings.userAgent}
                              onChange={(e) => handleSettingChange('userAgent', e.target.value)}
                              placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."
                              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-lime-500 transition-colors"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Proxy Settings Section */}
                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleSection('proxy')}
                      className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors w-full p-3 rounded-lg hover:bg-slate-800/30"
                    >
                      {expandedSections.has('proxy') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <Network className="w-4 h-4" />
                      <span className="font-medium">Proxy Settings</span>
                    </motion.button>
                    
                    <AnimatePresence>
                      {expandedSections.has('proxy') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pl-6 bg-slate-800/20 rounded-lg p-4 border border-slate-700/30"
                        >
                          <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                            <input
                              type="checkbox"
                              id="useProxy"
                              checked={settings.useProxy}
                              onChange={(e) => handleSettingChange('useProxy', e.target.checked)}
                              className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                            />
                            <label htmlFor="useProxy" className="text-white/80">
                              Use proxy for downloads
                            </label>
                          </div>

                          {settings.useProxy && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                  Proxy URL
                                </label>
                                <input
                                  type="text"
                                  value={settings.proxyUrl}
                                  onChange={(e) => handleSettingChange('proxyUrl', e.target.value)}
                                  placeholder="http://proxy:port or socks5://proxy:port"
                                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-lime-500 transition-colors"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-white/80 mb-2">
                                    Proxy Username
                                  </label>
                                  <input
                                    type="text"
                                    value={settings.proxyUsername}
                                    onChange={(e) => handleSettingChange('proxyUsername', e.target.value)}
                                    placeholder="Username (optional)"
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-lime-500 transition-colors"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-white/80 mb-2">
                                    Proxy Password
                                  </label>
                                  <input
                                    type="password"
                                    value={settings.proxyPassword}
                                    onChange={(e) => handleSettingChange('proxyPassword', e.target.value)}
                                    placeholder="Password (optional)"
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-lime-500 transition-colors"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Debug & Development Section */}
                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleSection('debug')}
                      className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors w-full p-3 rounded-lg hover:bg-slate-800/30"
                    >
                      {expandedSections.has('debug') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <Bug className="w-4 h-4" />
                      <span className="font-medium">Debug & Development</span>
                    </motion.button>
                    
                    <AnimatePresence>
                      {expandedSections.has('debug') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pl-6 bg-slate-800/20 rounded-lg p-4 border border-slate-700/30"
                        >
                          <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                            <input
                              type="checkbox"
                              id="enableDebug"
                              checked={settings.enableDebugMode}
                              onChange={(e) => handleSettingChange('enableDebugMode', e.target.checked)}
                              className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                            />
                            <label htmlFor="enableDebug" className="text-white/80">
                              Enable debug mode for yt-dlp
                            </label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-white/80 mb-2">
                                Log Level
                              </label>
                              <select
                                value={settings.logLevel}
                                onChange={(e) => handleSettingChange('logLevel', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
                              >
                                <option value="debug">Debug</option>
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                              </select>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                              <input
                                type="checkbox"
                                id="saveLogs"
                                checked={settings.saveLogsToFile}
                                onChange={(e) => handleSettingChange('saveLogsToFile', e.target.checked)}
                                className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                              />
                              <label htmlFor="saveLogs" className="text-white/80">
                                Save logs to file
                              </label>
                            </div>
                          </div>

                          {settings.saveLogsToFile && (
                            <div>
                              <label className="block text-sm font-medium text-white/80 mb-2">
                                Logs Directory
                              </label>
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  value={settings.logsDirectory}
                                  onChange={(e) => handleSettingChange('logsDirectory', e.target.value)}
                                  placeholder="Directory to save logs..."
                                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-lime-500 transition-colors"
                                />
                                <button
                                  onClick={handleSelectLogsDirectory}
                                  className="px-4 py-2 bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 border border-lime-500/30 rounded-lg transition-colors"
                                >
                                  Browse
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {activeTab === 'downloads' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <Download className="w-5 h-5 text-lime-400" />
                    <h3 className="text-lg font-semibold text-white">Download Settings</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-slate-800/20 rounded-lg p-6 border border-slate-700/30">
                      <h4 className="text-sm font-medium text-white/90 mb-4">Output & Quality</h4>
                      
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
                              className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-lime-500 transition-colors"
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                              Default Quality
                            </label>
                            <select
                              value={settings.qualityPreset}
                              onChange={(e) => handleSettingChange('qualityPreset', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
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
                              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            File Naming Template
                          </label>
                          <input
                            type="text"
                            value={settings.fileNamingTemplate}
                            onChange={(e) => handleSettingChange('fileNamingTemplate', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
                          />
                          <p className="text-xs text-white/50 mt-1">
                            Use yt-dlp format strings like %(title)s, %(uploader)s, %(upload_date)s
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/20 rounded-lg p-6 border border-slate-700/30">
                      <h4 className="text-sm font-medium text-white/90 mb-4">Custom Arguments</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            Custom yt-dlp Arguments
                          </label>
                          <div className="flex items-center space-x-2 mb-2">
                            <textarea
                              value={settings.customYtDlpArgs}
                              onChange={(e) => handleSettingChange('customYtDlpArgs', e.target.value)}
                              placeholder="--write-subs --embed-subs"
                              className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-lime-500 transition-colors h-20 resize-none"
                            />
                            <button
                              onClick={() => {
                                handleSettingChange('customYtDlpArgs', '');
                              }}
                              className="px-3 py-2 bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 hover:text-lime-300 border border-lime-500/30 rounded-lg transition-colors text-sm"
                            >
                              Use Default MP4
                            </button>
                          </div>
                          {!settings.customYtDlpArgs && (
                            <div className="p-3 bg-lime-500/20 border border-lime-500/30 rounded-lg">
                              <p className="text-xs text-lime-300 font-medium">Default Arguments:</p>
                              <p className="text-xs text-lime-400 font-mono mt-1">
                                --format "bestvideo[height&lt;=QUALITY][ext=mp4]+bestaudio[ext=m4a]/best[height&lt;=QUALITY]"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/20 rounded-lg p-6 border border-slate-700/30">
                      <h4 className="text-sm font-medium text-white/90 mb-4">Additional Options</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
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

                        <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
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

                        <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
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

                        <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
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

                        <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
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

                        <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
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

                    <div className="bg-slate-800/20 rounded-lg p-6 border border-slate-700/30">
                      <h4 className="text-sm font-medium text-white/90 mb-4">Logging</h4>
                      
                      <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                        <input
                          type="checkbox"
                          id="verboseLogging"
                          checked={settings.verboseLogging}
                          onChange={(e) => handleSettingChange('verboseLogging', e.target.checked)}
                          className="w-4 h-4 text-lime-500 bg-slate-700 border-slate-600 rounded focus:ring-lime-500"
                        />
                        <label htmlFor="verboseLogging" className="text-white/80 text-sm">
                          Verbose logging (show all console logs)
                        </label>
                      </div>
                      <p className="text-xs text-white/50 mt-2">
                        When enabled, all console logs will be captured. When disabled, only important logs (errors, warnings, and logs containing keywords like 'download', 'yt-dlp', 'error', etc.) will be shown.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'shortcuts' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <Keyboard className="w-5 h-5 text-lime-400" />
                    <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
                  </div>
                  
                  <div className="bg-slate-800/20 rounded-lg p-6 border border-slate-700/30">
                    <div className="space-y-3">
                      {[
                        { action: 'Settings', shortcut: 'Ctrl+O' },
                        { action: 'Downloads View', shortcut: 'Ctrl+1' },
                        { action: 'Queue View', shortcut: 'Ctrl+2' },
                        { action: 'History View', shortcut: 'Ctrl+3' },
                        { action: 'Logs View', shortcut: 'Ctrl+4' },
                        { action: 'Pause All', shortcut: 'Ctrl+P' },
                        { action: 'Resume All', shortcut: 'Ctrl+U' },
                        { action: 'Clear Completed', shortcut: 'Ctrl+X' },
                        { action: 'Retry Failed', shortcut: 'Ctrl+R' },
                      ].map(({ action, shortcut }) => (
                        <motion.div
                          key={action}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:bg-slate-700/40 transition-colors"
                        >
                          <span className="text-white/80">{action}</span>
                          <kbd className="px-3 py-1 bg-slate-600/50 border border-slate-500/50 rounded text-sm text-white/70 font-mono">
                            {shortcut}
                          </kbd>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default SettingsModal;