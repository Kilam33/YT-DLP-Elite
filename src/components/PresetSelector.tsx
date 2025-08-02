import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { updateSetting } from '../store/slices/settingsSlice';
import { PRESETS, getPresetsByCategory, findPresetById, type Preset } from '../config/presets';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Music, 
  Video, 
  FileText,
  Info,
  Subtitles,
  Download,
  Zap,
  Shield,
  Database,
  FolderOpen,
  Bug
} from 'lucide-react';

interface PresetSelectorProps {
  onClose: () => void;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({ onClose }) => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings.data);
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { simple, advanced } = getPresetsByCategory();

  const getIconForGroup = (group: string) => {
    switch (group) {
      case 'Audio Extraction':
        return <Music className="w-4 h-4" />;
      case 'Playback Cleanup & Enhancement':
        return <Play className="w-4 h-4" />;
      case 'Playlist & Bulk Download Control':
        return <Download className="w-4 h-4" />;
      case 'Performance & Bandwidth Tuning':
        return <Zap className="w-4 h-4" />;
      case 'Bypass & Spoofing':
        return <Shield className="w-4 h-4" />;
      case 'Metadata & Post-Processing':
        return <Database className="w-4 h-4" />;
      case 'Output Templates & File Structuring':
        return <FolderOpen className="w-4 h-4" />;
      case 'Developer & Maintenance Tools':
        return <Bug className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getIconForPreset = (preset: Preset) => {
    switch (preset.id) {
      case 'default-mp4':
        return <Video className="w-4 h-4" />;
      case 'audio-only':
      case 'audio-only-flac':
      case 'flac-lossless':
      case 'wav-uncompressed':
      case 'alac-apple':
      case 'mp3-portable':
      case 'original-audio':
        return <Music className="w-4 h-4" />;
      case 'video-only':
        return <Video className="w-4 h-4" />;
      case 'low-quality':
        return <FileText className="w-4 h-4" />;
      case 'high-quality':
        return <Video className="w-4 h-4" />;
      case 'with-metadata':
        return <Database className="w-4 h-4" />;
      case 'playlist-mode':
        return <Download className="w-4 h-4" />;
      case 'update-ytdlp':
        return <Settings className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handlePresetSelect = async (preset: Preset) => {
    dispatch(updateSetting({ key: 'customYtDlpArgs', value: preset.args }));
    
    // Save settings to main process
    try {
      await window.electronAPI?.saveSettings({ customYtDlpArgs: preset.args });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
    
    onClose();
  };

  const handleClearPreset = async () => {
    dispatch(updateSetting({ key: 'customYtDlpArgs', value: '' }));
    
    // Save settings to main process
    try {
      await window.electronAPI?.saveSettings({ customYtDlpArgs: '' });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleUseDefaultMp4 = async () => {
    // Clear any preset to use default behavior (quality selection from GUI)
    dispatch(updateSetting({ key: 'customYtDlpArgs', value: '' }));
    
    // Save settings to main process
    try {
      await window.electronAPI?.saveSettings({ customYtDlpArgs: '' });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const isPresetActive = (preset: Preset) => {
    if (preset.id === 'default-mp4') {
      // Default MP4 is active when no custom args are set
      return !settings.customYtDlpArgs || settings.customYtDlpArgs.trim() === '';
    }
    return settings.customYtDlpArgs === preset.args;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
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
              <h2 className="text-xl font-bold text-white">Download Presets</h2>
              <p className="text-white/60 text-sm">Choose from simple or advanced yt-dlp configurations</p>
                             {!settings.customYtDlpArgs && (
                 <div className="mt-2 p-2 bg-lime-500/20 rounded-lg border border-lime-600/50">
                   <div className="flex items-center space-x-2">
                     <Info className="w-4 h-4 text-lime-400" />
                     <p className="text-xs text-lime-300">Default MP4 preset is active - Quality selection from GUI will be used</p>
                   </div>
                 </div>
               )}
              {settings.customYtDlpArgs && (
                <div className="mt-2 p-2 bg-slate-800/50 rounded-lg border border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/60 mb-1">Current Arguments:</p>
                      <p className="text-xs text-lime-400 font-mono break-all">{settings.customYtDlpArgs}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                                              <button
                          onClick={handleUseDefaultMp4}
                          className="px-3 py-1.5 text-xs bg-lime-500/30 hover:bg-lime-500/40 text-lime-300 hover:text-lime-200 rounded transition-colors font-medium"
                        >
                          Use Default MP4
                        </button>
                      <button
                        onClick={handleClearPreset}
                        className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('simple')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'simple'
                ? 'text-lime-400 border-b-2 border-lime-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Simple Presets
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'advanced'
                ? 'text-lime-400 border-b-2 border-lime-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Advanced Presets
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[40vh] preset-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'simple' ? (
              <motion.div
                key="simple"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {simple.map((preset) => (
                    <motion.div
                      key={preset.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePresetSelect(preset)}
                      className={`
                        p-4 rounded-lg border cursor-pointer transition-all duration-200
                        ${isPresetActive(preset)
                          ? 'border-lime-400 bg-lime-500/10'
                          : 'border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/30'
                        }
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${preset.color || 'bg-slate-700/50'}`}>
                          {getIconForPreset(preset)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white mb-1">{preset.name}</h3>
                          <p className="text-white/60 text-sm">{preset.description}</p>
                          {isPresetActive(preset) && (
                            <div className="mt-2 text-xs text-lime-400 font-medium">
                              ✓ Active
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="advanced"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {Object.entries(advanced).map(([group, presets]) => (
                  <div key={group} className="space-y-3">
                    <button
                      onClick={() => toggleGroup(group)}
                      className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors w-full"
                    >
                      {expandedGroups.has(group) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      {getIconForGroup(group)}
                      <span className="font-medium">{group}</span>
                      <span className="text-white/40 text-sm">({presets.length})</span>
                    </button>
                    
                    <AnimatePresence>
                      {expandedGroups.has(group) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6"
                        >
                          {presets.map((preset) => (
                            <motion.div
                              key={preset.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handlePresetSelect(preset)}
                              className={`
                                p-3 rounded-lg border cursor-pointer transition-all duration-200
                                ${isPresetActive(preset)
                                  ? 'border-lime-400 bg-lime-500/10'
                                  : 'border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/30'
                                }
                              `}
                            >
                              <div className="flex items-start space-x-2">
                                <div className={`p-1.5 rounded ${preset.color || 'bg-slate-700/50'}`}>
                                  {getIconForPreset(preset)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-white text-sm mb-1">{preset.name}</h4>
                                  <p className="text-white/60 text-xs">{preset.description}</p>
                                  {isPresetActive(preset) && (
                                    <div className="mt-1 text-xs text-lime-400 font-medium">
                                      ✓ Active
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">
              {activeTab === 'simple' 
                ? 'Simple presets for common use cases'
                : 'Advanced presets for power users and specific scenarios'
              }
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PresetSelector; 