import React, { useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Download } from '../store/slices/downloadsSlice';
import { RootState } from '../store/store';
import { openMetadataModal } from '../store/slices/uiSlice';
import { 
  Play, 
  Pause, 
  Trash2, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Download as DownloadIcon,
  Info,
  ExternalLink,
  FolderOpen,
  Settings,
  Zap,
  Music,
  Video,
  Subtitles,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize, formatDuration, formatSpeed } from '../utils/format';
import { findPresetByArgs, findPresetById } from '../config/presets';
import toast from 'react-hot-toast';

interface DownloadCardProps {
  download: Download;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

const DownloadCard: React.FC<DownloadCardProps> = React.memo(({
  download,
  onPause,
  onResume,
  onRetry,
  onRemove,
}) => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings.data);

  // Performance optimization: Memoize expensive calculations
  const activePreset = useMemo(() => 
    settings.customYtDlpArgs ? findPresetByArgs(settings.customYtDlpArgs) : findPresetById('default-mp4'),
    [settings.customYtDlpArgs]
  );

  // Performance optimization: Memoize status-related calculations
  const statusInfo = useMemo(() => {
    const getStatusIcon = () => {
      switch (download.status) {
        case 'completed':
          return <CheckCircle className="w-5 h-5 text-lime-400" />;
        case 'error':
          return <AlertCircle className="w-5 h-5 text-red-400" />;
        case 'downloading':
          return <DownloadIcon className="w-5 h-5 text-blue-400 animate-pulse" />;
        case 'connecting':
        case 'initializing':
        case 'processing':
          return <DownloadIcon className="w-5 h-5 text-blue-400 animate-pulse" />;
        case 'paused':
          return <Pause className="w-5 h-5 text-orange-400" />;
        case 'pending':
          return <Clock className="w-5 h-5 text-slate-400" />;
        default:
          return <Clock className="w-5 h-5 text-slate-400" />;
      }
    };

    const getStatusColor = () => {
      switch (download.status) {
        case 'completed':
          return 'border-lime-500/30 bg-lime-500/5';
        case 'error':
          return 'border-red-500/30 bg-red-500/5';
        case 'downloading':
        case 'connecting':
        case 'initializing':
        case 'processing':
          return 'border-blue-500/30 bg-blue-500/5';
        case 'paused':
          return 'border-orange-500/30 bg-orange-500/5';
        case 'pending':
          return 'border-slate-600/30 bg-slate-700/10';
        default:
          return 'border-slate-700/50 bg-slate-800/20';
      }
    };

    const getStatusText = () => {
      switch (download.status) {
        case 'completed':
          return 'Completed';
        case 'error':
          return 'Error';
        case 'downloading':
          return 'Downloading';
        case 'connecting':
          return 'Connecting...';
        case 'initializing':
          return 'Initializing...';
        case 'processing':
          return 'Processing...';
        case 'paused':
          return 'Paused';
        case 'pending':
          return 'Queued';
        default:
          return 'Unknown';
      }
    };

    return {
      icon: getStatusIcon(),
      color: getStatusColor(),
      text: getStatusText(),
    };
  }, [download.status]);

  const getStatusIcon = () => statusInfo.icon;
  const getStatusColor = () => statusInfo.color;
  const getStatusText = () => statusInfo.text;

  // Performance optimization: Memoize icon calculations
  const qualityIcon = useMemo(() => {
    if (download.quality === 'audio') {
      return <Music className="w-3 h-3" />;
    }
    return <Video className="w-3 h-3" />;
  }, [download.quality]);

  const presetIcon = useMemo(() => {
    if (!activePreset) return <Settings className="w-3 h-3" />;
    
    switch (activePreset.id) {
      case 'audio-only':
      case 'music-enhanced':
      case 'flac-lossless':
      case 'wav-uncompressed':
      case 'alac-apple':
      case 'mp3-portable':
      case 'original-audio':
        return <Music className="w-3 h-3" />;
      case 'with-subtitles':
        return <Subtitles className="w-3 h-3" />;
      case 'with-metadata':
      case 'embed-metadata':
      case 'write-metadata-files':
        return <FileText className="w-3 h-3" />;
      default:
        return <Video className="w-3 h-3" />;
    }
  }, [activePreset]);

  const getQualityIcon = () => qualityIcon;
  const getPresetIcon = () => presetIcon;

  // Performance optimization: Memoize action handlers
  const handlePause = useCallback(() => onPause(download.id), [onPause, download.id]);
  const handleResume = useCallback(() => onResume(download.id), [onResume, download.id]);
  const handleRetry = useCallback(() => onRetry(download.id), [onRetry, download.id]);
  const handleRemove = useCallback(() => onRemove(download.id), [onRemove, download.id]);
  const handleOpenMetadata = useCallback(() => {
    dispatch(openMetadataModal({ download }));
  }, [dispatch, download]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        backdrop-blur-xl border rounded-xl p-4 transition-all duration-300 hover:shadow-lg
        ${getStatusColor()}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">
              {download.metadata?.title || 'Loading...'}
            </h3>
            <div className="flex items-center space-x-2">
              <p className="text-white/60 text-sm truncate">
                {new URL(download.url).hostname}
              </p>
              {download.status === 'pending' && (
                <span className="text-xs text-white/40 bg-slate-600/50 px-2 py-0.5 rounded">
                  {getStatusText()}
                </span>
              )}
            </div>
            {download.status === 'pending' && (
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="w-3 h-3 text-white/40" />
                <span className="text-xs text-white/40">Queued for download</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-1 ml-2">
          {download.metadata && (
            <button
              onClick={handleOpenMetadata}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="View Details"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => window.open(download.url, '_blank')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title="Open URL"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          
          {/* Show yt-dlp command for power users */}
          <button
            onClick={() => {
              const args = [
                '--newline',
                '--progress-template', 'download:[%(progress._percent_str)s] %(progress._speed_str)s ETA %(progress._eta_str)s downloaded %(progress._downloaded_bytes_str)s of %(progress._total_bytes_str)s',
                '--output', `${download.outputPath}/${settings.fileNamingTemplate}`,
                '--no-playlist',
                '--no-warnings',
              ];
              
              if (settings.customYtDlpArgs.trim()) {
                const customArgs = settings.customYtDlpArgs.trim().split(/\s+/).filter(arg => arg.length > 0);
                args.push(...customArgs);
              }
              
              if (settings.keepOriginalFiles) args.push('--keep-video');
              if (settings.writeSubtitles) args.push('--write-subs');
              if (settings.embedSubtitles) args.push('--embed-subs');
              if (settings.writeThumbnail) args.push('--write-thumbnail');
              if (settings.writeDescription) args.push('--write-description');
              if (settings.writeInfoJson) args.push('--write-info-json');
              if (settings.downloadSpeed > 0) args.push('--limit-rate', `${settings.downloadSpeed}k`);
              
              const hasCustomFormat = settings.customYtDlpArgs.includes('--format') || 
                                    settings.customYtDlpArgs.includes('--extract-audio');
              
              if (!hasCustomFormat && download.quality && download.quality !== 'best') {
                if (download.quality === 'audio') {
                  args.push('--extract-audio', '--audio-format', 'mp3');
                } else if (download.quality.includes('p')) {
                  const height = download.quality.replace('p', '');
                  args.push('--format', `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}]/best`);
                } else {
                  args.push('--format', download.quality);
                }
              } else if (!hasCustomFormat) {
                args.push('--format', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best');
              }
              
              args.push(download.url);
              
              const command = `yt-dlp ${args.join(' ')}`;
              navigator.clipboard.writeText(command);
              toast.success('Command copied to clipboard');
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title="Copy yt-dlp command"
          >
            <FileText className="w-4 h-4" />
          </button>
          
          {(download.status === 'downloading' || download.status === 'initializing' || download.status === 'connecting') && (
            <button
              onClick={handlePause}
              className="p-1.5 rounded-lg hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 transition-colors"
              title="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          
          {download.status === 'paused' && (
            <button
              onClick={handleResume}
              className="p-1.5 rounded-lg hover:bg-lime-500/20 text-lime-400 hover:text-lime-300 transition-colors"
              title="Resume"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          
          {download.status === 'error' && (
            <button
              onClick={handleRetry}
              className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors"
              title="Retry"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={handleRemove}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Download Settings */}
      <div className="mb-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Quality Setting */}
          <div className="flex items-center space-x-2">
            {getQualityIcon()}
            <span className="text-xs text-white/60">Quality:</span>
            <span className="text-xs text-lime-400 font-medium capitalize">{download.quality}</span>
          </div>

          {/* Output Path */}
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-3 h-3 text-white/60" />
            <span className="text-xs text-white/60">Output:</span>
            <span className="text-xs text-lime-400 font-medium truncate" title={download.outputPath}>
              {download.outputPath === settings.outputPath ? 'Default' : download.outputPath}
            </span>
          </div>

          {/* Active Preset */}
          <div className="flex items-center space-x-2">
            {getPresetIcon()}
            <span className="text-xs text-white/60">Preset:</span>
            <span className="text-xs text-lime-400 font-medium">
              {activePreset ? activePreset.name : 'Default MP4'}
            </span>
          </div>

          {/* Speed Limit */}
          {settings.downloadSpeed > 0 && (
            <div className="flex items-center space-x-2">
              <Zap className="w-3 h-3 text-white/60" />
              <span className="text-xs text-white/60">Speed:</span>
              <span className="text-xs text-lime-400 font-medium">
                {settings.downloadSpeed} KB/s
              </span>
            </div>
          )}
        </div>

        {/* Preset Description */}
        {activePreset && (
          <div className="mt-2 pt-2 border-t border-slate-700/30">
            <p className="text-xs text-white/50">{activePreset.description}</p>
          </div>
        )}

        {/* Expected File Info */}
        {download.metadata?.title && (
          <div className="mt-2 pt-2 border-t border-slate-700/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">Expected file:</span>
              <span className="text-xs text-lime-400 font-mono truncate max-w-48" title={`${download.metadata.title}.${download.quality === 'audio' ? 'mp3' : 'mp4'}`}>
                {download.metadata.title}.{download.quality === 'audio' ? 'mp3' : 'mp4'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {(download.status === 'downloading' || download.status === 'completed' || download.status === 'initializing' || download.status === 'connecting' || download.status === 'processing') ? (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-white/60">
              {download.status === 'initializing' || download.status === 'connecting' || download.status === 'processing'
                ? getStatusText() 
                : `${download.progress}% complete`
              }
            </span>
            {download.status === 'downloading' && (
              <div className="flex items-center space-x-4 text-xs text-white/60">
                <span>{formatSpeed(download.speed)}</span>
                <span>•</span>
                <span>ETA: {download.eta ? formatDuration(download.eta) : 'Calculating...'}</span>
              </div>
            )}
          </div>
          
          {/* Download Progress Details */}
          {download.status === 'downloading' && download.downloaded > 0 && download.filesize > 0 && (
            <div className="text-xs text-white/50 mb-2">
              Downloaded {formatFileSize(download.downloaded)} of {formatFileSize(download.filesize)}
            </div>
          )}
          {download.status === 'completed' && download.filesize > 0 && (
            <div className="text-xs text-white/50 mb-2">
              Final size: {formatFileSize(download.filesize)}
            </div>
          )}
          
          {/* Completed File Info */}
          {download.status === 'completed' && download.filename && (
            <div className="text-xs text-white/50 mb-2">
              <div className="flex items-center space-x-2">
                <span>File:</span>
                <span className="text-lime-400 font-mono truncate max-w-48" title={download.filename}>
                  {download.filename}
                </span>
              </div>
            </div>
          )}

          <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden">
            {(download.status === 'initializing' || download.status === 'connecting' || download.status === 'processing') ? (
              <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse" />
            ) : (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${download.progress}%` }}
                transition={{ duration: 0.3 }}
                className={`h-full rounded-full ${
                  download.status === 'completed' 
                    ? 'bg-gradient-to-r from-lime-400 to-lime-500' 
                    : 'bg-gradient-to-r from-blue-400 to-purple-500'
                }`}
              />
            )}
          </div>
        </div>
      ) : null}

      {/* Metadata */}
      {download.metadata && (
        <div className="flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center space-x-4">
            {download.metadata.duration && (
              <span>{formatDuration(download.metadata.duration)}</span>
            )}
            {download.metadata.view_count && (
              <span>{download.metadata.view_count.toLocaleString()} views</span>
            )}
            <span className="capitalize">{download.quality}</span>
            {download.status === 'completed' && download.startedAt && download.completedAt && (
              <span>
                {Math.round((new Date(download.completedAt).getTime() - new Date(download.startedAt).getTime()) / 1000)}s
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {download.downloaded > 0 && download.filesize > 0 && download.status === 'downloading' && (
              <span className="text-white/40">
                {formatFileSize(download.downloaded)} / {formatFileSize(download.filesize)}
              </span>
            )}
            {download.filesize > 0 && download.status === 'completed' && (
              <span className="text-lime-400 font-medium">{formatFileSize(download.filesize)}</span>
            )}
            {download.filesize > 0 && download.status !== 'downloading' && download.status !== 'completed' && (
              <span>{formatFileSize(download.filesize)}</span>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {download.status === 'error' && download.error && (
        <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-xs">{download.error}</p>
          {download.retryCount > 0 && (
            <p className="text-red-400/60 text-xs mt-1">
              Retry attempt: {download.retryCount}/{3}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
});

export default DownloadCard;