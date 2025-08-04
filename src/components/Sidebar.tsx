import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setActiveView, toggleSidebar } from '../store/slices/uiSlice';
import { updateSetting, openSettings } from '../store/slices/settingsSlice';
import { 
  Menu, 
  Download, 
  List, 
  History, 
  FileText, 
  Settings,
  ChevronRight,
  Play,
  Music,
  Video,
  Info,
  Subtitles,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PresetSelector from './PresetSelector';
import { findPresetById } from '../config/presets';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { activeView, sidebarCollapsed, logs } = useSelector((state: RootState) => state.ui);
  const settings = useSelector((state: RootState) => state.settings.data);
  const downloads = useSelector((state: RootState) => state.downloads.items);
  const queue = useSelector((state: RootState) => state.queue.items);
  const [showPresetSelector, setShowPresetSelector] = useState(false);

  const activeDownloads = downloads.filter(d => 
    d.status === 'downloading' || 
    d.status === 'paused' || 
    d.status === 'initializing' || 
    d.status === 'connecting' || 
    d.status === 'processing'
  ).length;
  const completedDownloads = downloads.filter(d => d.status === 'completed').length;
  const failedDownloads = downloads.filter(d => d.status === 'error').length;
  const queuedDownloads = queue.length;
  const errorLogs = logs.filter(log => log.level === 'error').length;

  // Most commonly used presets for quick access
  const quickActions = [
    {
      id: 'default-mp4',
      icon: Video,
      label: 'Default MP4',
      description: 'Default MP4 with quality selection',
      color: 'bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 hover:text-lime-300',
      activeColor: 'bg-lime-500/40 border border-lime-400/50',
      args: ''
    },
    {
      id: 'audio-only',
      icon: Music,
      label: 'Audio Only (MP3)',
      description: 'Extract to MP3',
      color: 'bg-blue-300/20 hover:bg-blue-300/30 text-blue-400 hover:text-blue-300',
      activeColor: 'bg-blue-300/40 border border-blue-400/50',
      args: '--extract-audio --audio-format mp3 --audio-quality 0'
    },
    {
      id: 'audio-only-flac',
      icon: Music,
      label: 'Audio Only (FLAC)',
      description: 'Extract to FLAC (Lossless)',
      color: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300',
      activeColor: 'bg-red-500/40 border border-red-400/50',
      args: '--extract-audio --audio-format flac --audio-quality 0'
    },
    {
      id: 'with-metadata',
      icon: Info,
      label: 'With Metadata',
      description: 'Embed info & thumb',
      color: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300',
      activeColor: 'bg-emerald-500/40 border border-emerald-400/50',
      args: '--embed-metadata --embed-thumbnail --add-metadata'
    },
    {
      id: 'with-subtitles',
      icon: Subtitles,
      label: 'With Subtitles',
      description: 'Download with subs',
      color: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 hover:text-cyan-300',
      activeColor: 'bg-cyan-500/40 border border-cyan-400/50',
      args: '--write-subs --embed-subs'
    }
  ];

  // Get current settings to determine active preset
  const currentArgs = settings.customYtDlpArgs;
  
  // Find which preset is currently active
  const activePreset = quickActions.find(action => {
    if (action.id === 'default-mp4') {
      // Default MP4 is active when no custom args are set
      return !currentArgs || currentArgs.trim() === '';
    }
    
    return currentArgs === action.args;
  }) || null;

  const handlePresetClick = async (action: typeof quickActions[0]) => {
    dispatch(updateSetting({ key: 'customYtDlpArgs', value: action.args }));
    
    // Save settings to main process
    try {
      await window.electronAPI?.saveSettings({ customYtDlpArgs: action.args });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const navigationItems = [
    {
      id: 'downloads',
      icon: Download,
      label: 'Downloads',
      description: 'Active downloads',
      badge: activeDownloads > 0 ? activeDownloads.toString() : null,
      badgeColor: 'bg-lime-500'
    },
    {
      id: 'queue',
      icon: Clock,
      label: 'Queue',
      description: 'Pending downloads',
      badge: queuedDownloads > 0 ? queuedDownloads.toString() : null,
      badgeColor: 'bg-orange-500'
    },
    {
      id: 'history',
      icon: History,
      label: 'History',
      description: 'Completed downloads',
      badge: completedDownloads > 0 ? completedDownloads.toString() : null,
      badgeColor: 'bg-blue-500'
    },
    {
      id: 'logs',
      icon: FileText,
      label: 'Logs',
      description: 'System logs',
      badge: errorLogs > 0 ? errorLogs.toString() : null,
      badgeColor: 'bg-red-500'
    }
  ];

  return (
    <>
      <motion.div
        initial={false}
        animate={{ 
          width: sidebarCollapsed ? 60 : 240 
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-white font-semibold"
              >
                Navigation
              </motion.h2>
            )}
          </AnimatePresence>
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => dispatch(setActiveView(item.id as any))}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-lime-500/20 to-purple-500/20 text-white border border-lime-500/30' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-lime-400' : ''}`} />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-xs opacity-60">{item.description}</span>
                      </div>
                      {item.badge && (
                        <span className={`
                          px-2 py-0.5 text-xs font-semibold rounded-full text-white
                          ${item.badgeColor || 'bg-slate-600'}
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {/* Settings Button */}
        <div className="p-2 border-t border-slate-700/50">
          <button
            onClick={() => dispatch(openSettings('general'))}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-medium"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Quick Actions - Scrollable */}
        <div className="flex-1 min-h-0 border-t border-slate-700/50">
          <div className="p-2 space-y-1 h-full flex flex-col">
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mb-2 flex-shrink-0"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-3 py-1">
                      Download Presets
                    </h3>
                    <button
                      onClick={() => setShowPresetSelector(true)}
                      className="p-1 rounded hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                  </div>
                  {activePreset && (
                    <div className="px-3 py-1">
                      <div className="text-xs text-lime-400 font-medium">{activePreset.label}</div>
                      <div className="text-xs text-white/60 truncate">{activePreset.description}</div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Scrollable presets container */}
            <div className="flex-1 overflow-y-auto sidebar-scrollbar">
              <div className={`grid ${sidebarCollapsed ? 'grid-cols-1' : 'grid-cols-1'} gap-1 pb-2`}>
                {quickActions.map((action) => {
                  const Icon = action.icon as React.ComponentType<{ className?: string }>;
                  const isActive = activePreset?.id === action.id;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handlePresetClick(action)}
                      className={`p-2 rounded-lg transition-colors flex items-center ${
                        isActive ? action.activeColor : action.color
                      }`}
                      title={action.description}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex flex-col items-start ml-2 min-w-0"
                          >
                            <span className="text-xs font-medium text-white/90 truncate">{action.label}</span>
                            <span className="text-xs text-white/60 truncate">{action.description}</span>
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Preset Selector Modal */}
      <AnimatePresence>
        {showPresetSelector && (
          <PresetSelector onClose={() => setShowPresetSelector(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;