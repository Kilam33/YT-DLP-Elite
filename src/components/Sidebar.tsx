import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setActiveView, toggleSidebar } from '../store/slices/uiSlice';
import { openSettings } from '../store/slices/settingsSlice';
import { 
  Download, 
  Clock, 
  History, 
  FileText, 
  Settings, 
  Menu,
  Music,
  Subtitles,
  Info,
  Video,
  Radio,
  FileVideo,
  FileAudio,
  FileImage
} from 'lucide-react';
import { updateSetting } from '../store/slices/settingsSlice';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { activeView, sidebarCollapsed } = useSelector((state: RootState) => state.ui);
  const downloads = useSelector((state: RootState) => state.downloads.items);
  
  const activeDownloads = downloads.filter(d => d.status === 'downloading').length;
  const completedDownloads = downloads.filter(d => d.status === 'completed').length;
  const failedDownloads = downloads.filter(d => d.status === 'error').length;

  const menuItems = [
    { 
      id: 'downloads', 
      icon: Download, 
      label: 'Downloads', 
      badge: activeDownloads > 0 ? activeDownloads.toString() : null,
      badgeColor: 'bg-lime-500'
    },
    { 
      id: 'queue', 
      icon: Clock, 
      label: 'Queue',
      badge: null
    },
    { 
      id: 'history', 
      icon: History, 
      label: 'History',
      badge: completedDownloads > 0 ? completedDownloads.toString() : null,
      badgeColor: 'bg-blue-500'
    },
    { 
      id: 'logs', 
      icon: FileText, 
      label: 'Logs',
      badge: failedDownloads > 0 ? failedDownloads.toString() : null,
      badgeColor: 'bg-red-500'
    },
  ];

  const quickActions = [
    {
      id: 'standard',
      icon: FileVideo,
      label: 'Standard',
      description: 'Best quality video + audio',
      color: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300',
      activeColor: 'bg-blue-500/40 border border-blue-400/50',
      args: '--format "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"'
    },
    {
      id: 'video-only',
      icon: Video,
      label: 'Video Only',
      description: 'Video without audio (for editing)',
      color: 'bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300',
      activeColor: 'bg-green-500/40 border border-green-400/50',
      args: '--format "bestvideo[ext=mp4]/best[ext=mp4]/best" --no-audio'
    },
    {
      id: 'audio-only',
      icon: Radio,
      label: 'Audio Only',
      description: 'Extract audio (MP3)',
      color: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300',
      activeColor: 'bg-purple-500/40 border border-purple-400/50',
      args: '--extract-audio --audio-format mp3 --audio-quality 0'
    },
    {
      id: 'music-enhanced',
      icon: Music,
      label: 'Music Enhanced',
      description: 'Audio with embedded thumbnails',
      color: 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 hover:text-pink-300',
      activeColor: 'bg-pink-500/40 border border-pink-400/50',
      args: '--extract-audio --audio-format mp3 --audio-quality 0 --embed-thumbnail'
    },
    {
      id: 'with-subtitles',
      icon: Subtitles,
      label: 'With Subtitles',
      description: 'Include subtitles',
      color: 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 hover:text-orange-300',
      activeColor: 'bg-orange-500/40 border border-orange-400/50',
      args: '--write-sub --write-auto-sub --sub-lang en'
    },
    {
      id: 'with-metadata',
      icon: Info,
      label: 'With Metadata',
      description: 'Include video info & thumbnails',
      color: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300',
      activeColor: 'bg-red-500/40 border border-red-400/50',
      args: '--write-info-json --write-thumbnail --write-description'
    }
  ];

  // Get current settings to determine active preset
  const settings = useSelector((state: RootState) => state.settings.data);
  const currentArgs = settings.customYtDlpArgs;
  
  // Find which preset is currently active
  const activePreset = quickActions.find(action => {
    if (!currentArgs) return action.id === 'standard'; // Default to standard if no args
    
    switch (action.id) {
      case 'standard':
        return currentArgs.includes('bestvideo[ext=mp4]+bestaudio') || 
               (currentArgs.includes('best[ext=mp4]') && !currentArgs.includes('--no-audio') && !currentArgs.includes('--extract-audio'));
      case 'video-only':
        return currentArgs.includes('bestvideo[ext=mp4]') && currentArgs.includes('--no-audio');
      case 'audio-only':
        return currentArgs.includes('--extract-audio') && !currentArgs.includes('--embed-thumbnail');
      case 'music-enhanced':
        return currentArgs.includes('--extract-audio') && currentArgs.includes('--embed-thumbnail');
      case 'with-subtitles':
        return currentArgs.includes('--write-sub');
      case 'with-metadata':
        return currentArgs.includes('--write-info-json');
      default:
        return false;
    }
  });

  const handlePresetClick = (action: typeof quickActions[0]) => {
    dispatch(updateSetting({ key: 'customYtDlpArgs', value: action.args }));
  };

  return (
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

      {/* Menu Items */}
      <div className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
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
                    <span className="font-medium">{item.label}</span>
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

      {/* Quick Actions */}
      <div className="p-2 border-t border-slate-700/50 space-y-1">
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-2"
            >
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-3 py-1">
                Download Presets
              </h3>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className={`grid ${sidebarCollapsed ? 'grid-cols-1' : 'grid-cols-1'} gap-1`}>
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
        
        {/* Settings Button */}
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
    </motion.div>
  );
};

export default Sidebar;