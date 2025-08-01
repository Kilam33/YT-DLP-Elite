import React from 'react';
import { useDispatch } from 'react-redux';
import { Download } from '../store/slices/downloadsSlice';
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
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize, formatDuration, formatSpeed } from '../utils/format';

interface DownloadCardProps {
  download: Download;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

const DownloadCard: React.FC<DownloadCardProps> = ({
  download,
  onPause,
  onResume,
  onRetry,
  onRemove,
}) => {
  const dispatch = useDispatch();

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
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-1 ml-2">
          {download.metadata && (
            <button
              onClick={() => dispatch(openMetadataModal(download.metadata))}
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
          
          {(download.status === 'downloading' || download.status === 'initializing' || download.status === 'connecting') && (
            <button
              onClick={() => onPause(download.id)}
              className="p-1.5 rounded-lg hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 transition-colors"
              title="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          
          {download.status === 'paused' && (
            <button
              onClick={() => onResume(download.id)}
              className="p-1.5 rounded-lg hover:bg-lime-500/20 text-lime-400 hover:text-lime-300 transition-colors"
              title="Resume"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          
          {download.status === 'error' && (
            <button
              onClick={() => onRetry(download.id)}
              className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors"
              title="Retry"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => onRemove(download.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
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
              <span className="text-xs text-white/60">
                {formatSpeed(download.speed)} • ETA: {download.eta ? formatDuration(download.eta) : 'Calculating...'}
              </span>
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
};

export default DownloadCard;