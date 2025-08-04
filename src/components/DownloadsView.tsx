import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { 
  setDownloads, 
  updateDownload, 
  addDownload,
  clearCompleted,
  setCurrentPage,
  setPageSize,
  selectPaginatedItems,
  selectPaginationInfo,
  updateMultipleDownloads
} from '../store/slices/downloadsSlice';
import { addToQueue, removeFromQueue } from '../store/slices/queueSlice';
import { addLog } from '../store/slices/uiSlice';
import DownloadCard from './DownloadCard';
import { useDebouncedDownloadUpdates } from '../hooks/useDebouncedDownloadUpdates';
import { useRetryLogic } from '../hooks/useRetryLogic';
import Pagination from './Pagination';
import { loadDownloadsFromStorage } from '../store/middleware/persistenceMiddleware';
import { 
  Plus, 
  Trash2,
  Download,
  Clipboard,
  FolderOpen,
  AlertCircle,
  Play,
  Clock,
  User,
  Eye,
  Download as DownloadIcon,
  Plus as PlusIcon,
  CheckCircle,
  Settings,
  Music
} from 'lucide-react';
import { OptimizedAnimatePresence, OptimizedMotionDiv, OptimizedListContainer, OptimizedListItem } from './OptimizedAnimations';
import VirtualizedDownloadsList from './VirtualizedDownloadsList';
import toast from 'react-hot-toast';
import { formatDuration } from '../utils/format';
import { findPresetByArgs } from '../config/presets';
import { validateUrl, sanitizeUrl, validateDownloadOptions, validateMetadataIntegrity } from '../utils/validation';
import notificationQueue from '../utils/notificationQueue';

interface VideoMetadata {
  title: string;
  duration: number;
  view_count: number;
  uploader: string;
  upload_date: string;
  description: string;
  thumbnail: string;
  formats: Array<{
    format_id: string;
    ext: string;
    height?: number;
    filesize?: number;
    vcodec?: string;
    acodec?: string;
  }>;
}

interface PlaylistMetadata {
  _type: 'playlist';
  title: string;
  entries: Array<{
    id: string;
    title: string;
    duration: number;
    uploader: string;
    thumbnail: string;
    url: string;
  }>;
}

const DownloadsView: React.FC = () => {
  const dispatch = useDispatch();
  // Performance optimization: Use paginated downloads instead of all downloads
  const downloads = useSelector(selectPaginatedItems);
  const paginationInfo = useSelector(selectPaginationInfo);
  const settings = useSelector((state: RootState) => state.settings.data);
  const activeView = useSelector((state: RootState) => state.ui.activeView);
  
  // Performance optimization: Debounced download updates
  const { queueUpdate, flushImmediately } = useDebouncedDownloadUpdates();
  
  // Performance optimization: Retry logic with exponential backoff
  const { executeWithRetry, getRetryStats } = useRetryLogic({
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isAddingDownload, setIsAddingDownload] = useState(false);
  const [isStartingDownload, setIsStartingDownload] = useState(false);
  const [ytDlpAvailable, setYtDlpAvailable] = useState(true);
  const [ffmpegAvailable, setFfmpegAvailable] = useState(true);
  const [metadata, setMetadata] = useState<VideoMetadata | PlaylistMetadata | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDownloads();
    checkYtDlpAvailability();
    checkFfmpegAvailability();
    
    // Set up download update listener with debounced updates for performance
          if (window.electronAPI) {
        // Performance optimization: Handle single download updates
        window.electronAPI.onDownloadUpdated((download) => {
          // Use debounced updates for progress changes to reduce re-renders
          if ((download.status === 'downloading' || download.status === 'initializing' || download.status === 'connecting' || download.status === 'processing') && download.progress !== undefined && download.progress >= 0) {
            queueUpdate({
              id: download.id,
              progress: download.progress,
              speed: download.speed,
              eta: download.eta,
              downloaded: download.downloaded,
              filesize: download.filesize,
              status: download.status, // Include status in progress updates
            });
          } else {
            // For status changes, update immediately
            dispatch(updateDownload(download));
            flushImmediately();
          }
          
          // Remove from queue if download starts
          if (download.status === 'downloading' || download.status === 'initializing' || download.status === 'connecting' || download.status === 'processing' || download.status === 'pending') {
            dispatch(removeFromQueue(download.id));
          }

          // Handle completed downloads with delay
          if (download.status === 'completed') {
            // Show success notification
            toast.success(`Download completed: ${download.metadata?.title || 'Video'}`, {
              duration: 3000,
              icon: '✅',
            });
            
            // Keep completed downloads visible for a moment before moving to history
            setTimeout(() => {
              // The download will automatically move to history view
              // but we keep it visible in downloads for a moment for better UX
            }, 3000); // 3 second delay
          }
        });

        // Performance optimization: Handle batched download updates
        window.electronAPI.onDownloadUpdatedBatch?.((downloads) => {
          // Process multiple downloads at once for better performance
          const updates = downloads.map(download => ({
            id: download.id,
            progress: download.progress,
            speed: download.speed,
            eta: download.eta,
            downloaded: download.downloaded,
            filesize: download.filesize,
            status: download.status,
          }));

          // Use batch update for multiple downloads
          if (updates.length > 1) {
            dispatch(updateMultipleDownloads(updates as any));
          } else if (updates.length === 1) {
            dispatch(updateDownload(updates[0] as any));
          }

          // Handle queue removals and completions
          downloads.forEach(download => {
            if (download.status === 'downloading' || download.status === 'initializing' || download.status === 'connecting' || download.status === 'processing' || download.status === 'pending') {
              dispatch(removeFromQueue(download.id));
            }

            if (download.status === 'completed') {
              // Show success notification for batch updates
              toast.success(`Download completed: ${download.metadata?.title || 'Video'}`, {
                duration: 3000,
                icon: '✅',
              });
              
              setTimeout(() => {
                // Keep completed downloads visible for a moment
              }, 3000);
            }
          });
        });
      }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeDownloadUpdateListener();
      }
    };
  }, [dispatch]);

  // Focus URL input when view becomes active
  useEffect(() => {
    if (activeView === 'downloads' && urlInputRef.current) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 100);
    }
  }, [activeView]);

  useEffect(() => {
    if (url.trim() && ytDlpAvailable) {
      const timeoutId = setTimeout(() => {
        fetchMetadata();
      }, 1000);
      return () => clearTimeout(timeoutId);
    } else {
      setMetadata(null);
      setShowPreview(false);
    }
  }, [url]);

  const loadDownloads = async () => {
    try {
      // Performance optimization: Load from localStorage first for instant UI
      const storedDownloads = loadDownloadsFromStorage();
      if (storedDownloads.length > 0) {
        dispatch(setDownloads(storedDownloads));
        console.log(`Loaded ${storedDownloads.length} downloads from localStorage`);
      }
      
      // Then try to load from Electron storage (if available)
      if (window.electronAPI) {
        try {
          const downloadsData = await window.electronAPI.getDownloads();
          if (downloadsData && downloadsData.length > 0) {
            dispatch(setDownloads(downloadsData));
            console.log(`Loaded ${downloadsData.length} downloads from Electron storage`);
          }
        } catch (electronError) {
          console.warn('Failed to load from Electron storage, using localStorage:', electronError);
        }
      }
    } catch (error) {
      console.error('Failed to load downloads:', error);
      toast.error('Failed to load downloads');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to load downloads from storage',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const checkYtDlpAvailability = async () => {
    try {
      const available = await window.electronAPI?.checkYtDlp();
      setYtDlpAvailable(available ?? false);
      if (!available) {
        dispatch(addLog({
          level: 'warning',
          message: 'yt-dlp not found - please install it to use this application',
        }));
      }
    } catch (error) {
      setYtDlpAvailable(false);
      dispatch(addLog({
        level: 'error',
        message: 'Failed to check yt-dlp availability',
      }));
    }
  };

  const checkFfmpegAvailability = async () => {
    try {
      const available = await window.electronAPI?.checkFfmpeg();
      setFfmpegAvailable(available ?? false);
      if (!available) {
        dispatch(addLog({
          level: 'warning',
          message: 'FFmpeg not found - recommended for better quality downloads',
        }));
      }
    } catch (error) {
      setFfmpegAvailable(false);
      dispatch(addLog({
        level: 'error',
        message: 'Failed to check FFmpeg availability',
      }));
    }
  };

  const fetchMetadata = async () => {
    if (!url.trim()) return;
    
    setIsLoadingMetadata(true);
    try {
      const data = await window.electronAPI?.getMetadata(url.trim());
      if (data) {
        setMetadata(data);
        setShowPreview(true);
        
        // Set default quality to highest available
        const qualities = getAvailableQualities(data.formats || []);
        if (qualities.length > 0) {
          setQuality(qualities[0]);
        }
        
        dispatch(addLog({
          level: 'info',
          message: `Fetched metadata for: ${data.title}`,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      setMetadata(null);
      dispatch(addLog({
        level: 'error',
        message: `Failed to fetch metadata for URL: ${url}`,
      }));
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const isPlaylistMetadata = (metadata: VideoMetadata | PlaylistMetadata): metadata is PlaylistMetadata => {
    return '_type' in metadata && metadata._type === 'playlist';
  };

  const getAvailableQualities = (formats: VideoMetadata['formats']) => {
    if (!formats) return [];
    
    const qualities = new Set<string>();
    
    formats.forEach(format => {
      if (format.height) {
        qualities.add(`${format.height}p`);
      }
      if (format.vcodec === 'none' && format.acodec !== 'none') {
        qualities.add('audio');
      }
    });
    
    return Array.from(qualities).sort((a, b) => {
      if (a === 'audio') return 1;
      if (b === 'audio') return -1;
      const aHeight = parseInt(a.replace('p', ''));
      const bHeight = parseInt(b.replace('p', ''));
      return bHeight - aHeight; // Sort by height descending
    });
  };

  const handlePause = async (id: string) => {
    try {
      await window.electronAPI?.pauseDownload(id);
      toast.success('Download paused');
      dispatch(addLog({
        level: 'info',
        message: 'Download paused',
        downloadId: id,
      }));
    } catch (error) {
      toast.error('Failed to pause download');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to pause download',
        downloadId: id,
      }));
    }
  };

  const handleResume = async (id: string) => {
    try {
      await window.electronAPI?.resumeDownload(id);
      toast.success('Download resumed');
      dispatch(addLog({
        level: 'info',
        message: 'Download resumed',
        downloadId: id,
      }));
    } catch (error) {
      toast.error('Failed to resume download');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to resume download',
        downloadId: id,
      }));
    }
  };

  const handleRetry = async (id: string) => {
    try {
      const retryStats = getRetryStats(id);
      
      // Check if circuit breaker is open
      if (retryStats.circuitBreakerOpen) {
        toast.error(`Too many failures. Please wait before retrying.`);
        return;
      }

      await executeWithRetry(
        id,
        () => window.electronAPI?.retryDownload(id) || Promise.reject(new Error('Electron API not available')),
        (retryCount, delay) => {
          toast.success(`Retry ${retryCount} initiated. Next retry in ${Math.ceil(delay / 1000)}s if needed.`);
          dispatch(addLog({
            level: 'info',
            message: `Retry ${retryCount} for download ${id} (delay: ${delay}ms)`,
            downloadId: id,
          }));
        },
        (error) => {
          toast.error(`Max retries exceeded for download ${id}`);
          dispatch(addLog({
            level: 'error',
            message: `Max retries exceeded for download ${id}: ${error.message}`,
            downloadId: id,
          }));
        }
      );
      
      toast.success('Download retry successful');
      dispatch(addLog({
        level: 'info',
        message: 'Retry successful for download',
        downloadId: id,
      }));
    } catch (error) {
      console.error('Failed to retry download:', error);
      toast.error('Failed to retry download');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to retry download',
        downloadId: id,
      }));
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await window.electronAPI?.removeDownload(id);
      toast.success('Download removed');
      dispatch(addLog({
        level: 'info',
        message: 'Download removed',
        downloadId: id,
      }));
      loadDownloads();
    } catch (error) {
      toast.error('Failed to remove download');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to remove download',
        downloadId: id,
      }));
    }
  };

  const handleClearCompleted = async () => {
    try {
      await window.electronAPI?.clearCompleted();
      dispatch(clearCompleted());
      toast.success('Completed downloads cleared');
      dispatch(addLog({
        level: 'info',
        message: 'Completed downloads cleared',
      }));
    } catch (error) {
      toast.error('Failed to clear completed downloads');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to clear completed downloads',
      }));
    }
  };

  // Performance optimization: Pagination handlers
  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  const handlePageSizeChange = (pageSize: number) => {
    dispatch(setPageSize(pageSize));
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await window.electronAPI?.getClipboard();
      if (clipboardText) {
        setUrl(clipboardText);
        dispatch(addLog({
          level: 'info',
          message: 'URL pasted from clipboard',
        }));
      }
    } catch (error) {
      toast.error('Failed to read clipboard');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to read clipboard',
      }));
    }
  };

  const handleSelectFolder = async () => {
    try {
      const folder = await window.electronAPI?.selectFolder();
      if (folder) {
        setOutputPath(folder);
        dispatch(addLog({
          level: 'info',
          message: `Output folder selected: ${folder}`,
        }));
      }
    } catch (error) {
      toast.error('Failed to select folder');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to select output folder',
      }));
    }
  };

  const handleStartDownload = async () => {
    // Validate URL
    const sanitizedUrl = sanitizeUrl(url.trim());
    const urlValidation = validateUrl(sanitizedUrl);
    if (!urlValidation.isValid) {
      notificationQueue.error(urlValidation.error || 'Invalid URL');
      return;
    }

    if (!metadata) {
      notificationQueue.warning('Please wait for metadata to load');
      return;
    }

    // Validate metadata integrity
    const metadataValidation = validateMetadataIntegrity(metadata);
    if (!metadataValidation.isValid) {
      notificationQueue.error(`Metadata validation failed: ${metadataValidation.errors.join(', ')}`);
      return;
    }

    if (!quality.trim()) {
      notificationQueue.warning('Please select a quality');
      return;
    }

    setIsStartingDownload(true);
    
    try {
      const downloadOptions = {
        outputPath: outputPath || settings.outputPath,
        quality: quality,
      };
      
      // Validate download options
      const optionsValidation = validateDownloadOptions(downloadOptions);
      if (!optionsValidation.isValid) {
        notificationQueue.error(optionsValidation.error || 'Invalid download options');
        return;
      }
      
      const download = await window.electronAPI?.addDownload(sanitizedUrl, downloadOptions);
      
      if (download) {
        dispatch(addDownload(download));
        
        // Start the download immediately
        const started = await window.electronAPI?.startDownload(download.id);
        if (started) {
          notificationQueue.success('Download started successfully');
        } else {
          notificationQueue.error('Failed to start download');
          dispatch(addLog({
            level: 'error',
            message: 'Failed to start download',
            downloadId: download.id,
          }));
        }
        
        // Reset form
        setUrl('');
        setQuality('');
        setOutputPath('');
        setMetadata(null);
        setShowPreview(false);
      }
    } catch (error) {
      console.error('Failed to start download:', error);
      notificationQueue.error('Failed to start download');
      dispatch(addLog({
        level: 'error',
        message: `Failed to start download: ${error}`,
      }));
    } finally {
      setIsStartingDownload(false);
    }
  };

  const handleAddToQueue = async () => {
    if (!url.trim() || !metadata) {
      toast.error('Please wait for metadata to load');
      return;
    }

    if (!quality.trim()) {
      toast.error('Please select a quality');
      return;
    }

    setIsAddingDownload(true);
    
    try {
      const downloadOptions = {
        outputPath: outputPath || settings.outputPath,
        quality: quality,
      };
      
      const download = await window.electronAPI?.addDownload(url.trim(), downloadOptions);
      
      if (download) {
        dispatch(addDownload(download));
        dispatch(addToQueue(download.id));
        toast.success('Added to download queue');
        dispatch(addLog({
          level: 'info',
          message: `Added to queue: ${metadata.title} (${quality})`,
          downloadId: download.id,
        }));
        
        // Reset form
        setUrl('');
        setQuality('');
        setOutputPath('');
        setMetadata(null);
        setShowPreview(false);
      }
    } catch (error) {
      console.error('Failed to add to queue:', error);
      toast.error('Failed to add to queue');
      dispatch(addLog({
        level: 'error',
        message: `Failed to add to queue: ${error}`,
      }));
    } finally {
      setIsAddingDownload(false);
    }
  };

  const handleAddPlaylistToQueue = async () => {
    if (!metadata || !('_type' in metadata) || metadata._type !== 'playlist' || !url.trim()) {
      toast.error('Please wait for playlist metadata to load');
      return;
    }

    setIsAddingDownload(true);
    
    try {
      const playlistData = {
        entries: metadata.entries,
        quality,
        outputPath: outputPath || settings.outputPath,
      };
      
      const downloads = await window.electronAPI?.addPlaylistVideos(playlistData);
      
      if (downloads && downloads.length > 0) {
        downloads.forEach(download => {
          dispatch(addDownload(download));
          dispatch(addToQueue(download.id));
        });
        
        toast.success(`Added ${downloads.length} videos to download queue`);
        dispatch(addLog({
          level: 'info',
          message: `Added playlist to queue: ${metadata.title} (${downloads.length} videos)`,
        }));
        
        // Reset form
        setUrl('');
        setQuality('');
        setOutputPath('');
        setMetadata(null);
        setShowPreview(false);
      }
    } catch (error) {
      console.error('Failed to add playlist to queue:', error);
      toast.error('Failed to add playlist to queue');
      dispatch(addLog({
        level: 'error',
        message: `Failed to add playlist to queue: ${error}`,
      }));
    } finally {
      setIsAddingDownload(false);
    }
  };

  // Filter to show only actively downloading items (not queued or completed)
  const activeDownloads = downloads.filter(d => 
    d.status === 'downloading' || d.status === 'paused' || d.status === 'completed' || d.status === 'initializing' || d.status === 'connecting' || d.status === 'processing'
  );

  // Separate queued downloads from actively downloading
  const queuedDownloads = downloads.filter(d => d.status === 'pending');
  const downloadingItems = activeDownloads.filter(d => 
    d.status === 'downloading' || d.status === 'paused' || d.status === 'initializing' || d.status === 'connecting' || d.status === 'processing'
  );
  const completedItems = activeDownloads
    .filter(d => d.status === 'completed')
    .sort((a, b) => {
      // Sort by completion time, most recent first
      if (a.completedAt && b.completedAt) {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      }
      // If no completion time, sort by ID (newer IDs first)
      return b.id.localeCompare(a.id);
    })
    .slice(0, 10); // Limit to 10 most recent completed downloads

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading downloads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">Downloads</h1>
            {settings.customYtDlpArgs && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-lime-500/20 border border-lime-500/30 rounded-lg">
                <Settings className="w-4 h-4 text-lime-400" />
                <span className="text-sm text-lime-400 font-medium">
                  {findPresetByArgs(settings.customYtDlpArgs)?.name || 'Custom Preset'}
                </span>
              </div>
            )}
            {!settings.customYtDlpArgs && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-lime-500/20 border border-lime-500/30 rounded-lg">
                <Settings className="w-4 h-4 text-lime-400" />
                <span className="text-sm text-lime-400 font-medium">
                  Default MP4 Preset Active
                </span>
              </div>
            )}
          </div>
          {activeDownloads.length > 0 && (
            <button
              onClick={handleClearCompleted}
              className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Completed</span>
            </button>
          )}
        </div>

        {/* URL Input Section */}
        <div className="space-y-4">
          {/* yt-dlp Warning */}
          {!ytDlpAvailable && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">yt-dlp not found</span>
              </div>
              <p className="text-xs text-red-300 mt-1">
                Please install yt-dlp to use this application. Visit https://github.com/yt-dlp/yt-dlp for installation instructions.
              </p>
            </div>
          )}

          {/* FFmpeg Warning */}
          {!ffmpegAvailable && (
            <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <div className="flex items-center space-x-2 text-orange-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">FFmpeg not found</span>
              </div>
              <p className="text-xs text-orange-300 mt-1">
                FFmpeg is recommended for better quality downloads and format selection. Visit https://ffmpeg.org/download.html for installation.
              </p>
            </div>
          )}

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Video URL
            </label>
            <div className="relative">
              <input
                ref={urlInputRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-lime-500 transition-colors"
              />
              <button
                onClick={handlePasteFromClipboard}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Paste from clipboard"
              >
                <Clipboard className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metadata Preview */}
          {isLoadingMetadata && (
            <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <div className="flex items-center space-x-2 text-white/60">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-lime-400"></div>
                <span className="text-sm">Loading video information...</span>
              </div>
            </div>
          )}

          {metadata && showPreview && (
            <OptimizedMotionDiv
              variants={{
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -10 }
              }}
              className="p-6 bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-xl border border-slate-600/50 shadow-lg"
            >
              {/* Playlist Preview */}
              {isPlaylistMetadata(metadata) ? (
                <div>
                  <div className="flex space-x-4 mb-6">
                    {/* Playlist Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-lg line-clamp-2 mb-2">
                        📁 {metadata.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-white/70">
                        <div className="flex items-center space-x-2 px-3 py-1 bg-lime-500/20 border border-lime-500/30 rounded-lg">
                          <Download className="w-4 h-4 text-lime-400" />
                          <span className="text-lime-400 font-medium">{metadata.entries.length} videos</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Playlist Entries Preview */}
                  <div className="max-h-48 overflow-y-auto space-y-3 mb-6 bg-slate-800/30 rounded-lg p-4">
                    {metadata.entries.slice(0, 5).map((entry, index) => (
                      <div key={entry.id} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30 hover:bg-slate-600/50 transition-colors">
                        <span className="text-sm text-lime-400 font-medium w-8">#{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/90 line-clamp-1 font-medium">{entry.title}</p>
                          <div className="flex items-center space-x-3 text-xs text-white/60 mt-1">
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{entry.uploader}</span>
                            </span>
                            {entry.duration && (
                              <>
                                <span>•</span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDuration(entry.duration)}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {metadata.entries.length > 5 && (
                      <div className="text-sm text-white/60 text-center py-3 bg-slate-700/30 rounded-lg">
                        ... and {metadata.entries.length - 5} more videos
                      </div>
                    )}
                  </div>

                  {/* Quality and Output Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Quality Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-white/90 mb-3">
                        Quality Selection
                      </label>
                      <div className="relative">
                        <select
                          value={quality}
                          onChange={(e) => setQuality(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700/70 border border-slate-600/50 rounded-lg text-lime-400 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all duration-200 appearance-none cursor-pointer hover:bg-slate-600/70 [text-shadow:0_0_8px_rgba(132,204,22,0.6)]"
                        >
                          <option value="" className="text-white/60">Select quality...</option>
                          {!isPlaylistMetadata(metadata) ? getAvailableQualities((metadata as VideoMetadata).formats || []).map(q => (
                            <option key={q} value={q} className="text-lime-400 bg-slate-700">{q}</option>
                          )) : (
                            <option value="" className="text-white/60">No quality options for playlists</option>
                          )}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Output Path */}
                    <div>
                      <label className="block text-sm font-semibold text-white/90 mb-3">
                        Output Folder
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={outputPath}
                          onChange={(e) => setOutputPath(e.target.value)}
                          placeholder={settings.outputPath || 'Default downloads folder'}
                          className="w-full px-4 py-3 pr-12 bg-slate-700/70 border border-slate-600/50 rounded-lg text-lime-400 placeholder-white/40 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all duration-200 hover:bg-slate-600/70 shadow-[0_0_0_1px_rgba(132,204,22,0.1)] focus:shadow-[0_0_20px_rgba(132,204,22,0.3)] [text-shadow:0_0_8px_rgba(132,204,22,0.6)]"
                        />
                        <button
                          onClick={handleSelectFolder}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-lime-500/20 text-white/60 hover:text-lime-400 transition-colors"
                          title="Select folder"
                          type="button"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-600/50">
                    <button
                      onClick={handleAddPlaylistToQueue}
                      disabled={isAddingDownload || isStartingDownload}
                      className="px-6 py-3 rounded-lg bg-slate-600/50 hover:bg-slate-500/50 text-white/90 hover:text-white transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-500/30 hover:border-slate-400/50"
                    >
                      {isAddingDownload ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-4 h-4" />
                          <span>Add All to Queue</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Single Video Preview */
                <div>
                  <div className="flex space-x-6 mb-6">
                    {/* Enhanced Thumbnail */}
                    <div className="flex-shrink-0">
                      <div className="relative group">
                        <img 
                          src={metadata.thumbnail} 
                          alt={metadata.title}
                          className="w-32 h-20 object-cover rounded-xl shadow-lg border border-slate-600/50 group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="flex items-center justify-center w-8 h-8 bg-lime-500/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Video Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-lg line-clamp-2 mb-3 leading-tight">
                        {metadata.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-white/70 mb-3">
                        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-700/50 rounded-lg border border-slate-600/30">
                          <User className="w-4 h-4 text-lime-400" />
                          <span className="text-lime-400 font-medium">{metadata.uploader}</span>
                        </div>
                        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-700/50 rounded-lg border border-slate-600/30">
                          <Clock className="w-4 h-4 text-lime-400" />
                          <span className="text-lime-400 font-medium">{formatDuration(metadata.duration)}</span>
                        </div>
                        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-700/50 rounded-lg border border-slate-600/30">
                          <Eye className="w-4 h-4 text-lime-400" />
                          <span className="text-lime-400 font-medium">{metadata.view_count?.toLocaleString() || 'N/A'}</span>
                        </div>
                      </div>
                      {metadata.description && (
                        <p className="text-sm text-white/60 line-clamp-2">
                          {metadata.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quality and Output Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Enhanced Quality Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-white/90 mb-3">
                        Quality Selection
                      </label>
                      <div className="relative">
                        <select
                          value={quality}
                          onChange={(e) => setQuality(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700/70 border border-slate-600/50 rounded-lg text-lime-400 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all duration-200 appearance-none cursor-pointer hover:bg-slate-600/70 [text-shadow:0_0_8px_rgba(132,204,22,0.6)]"
                        >
                          <option value="" className="text-white/60">Select quality...</option>
                          {!isPlaylistMetadata(metadata) ? getAvailableQualities((metadata as VideoMetadata).formats || []).map(q => (
                            <option key={q} value={q} className="text-lime-400 bg-slate-700">{q}</option>
                          )) : (
                            <option value="" className="text-white/60">No quality options for playlists</option>
                          )}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Output Path */}
                    <div>
                      <label className="block text-sm font-semibold text-white/90 mb-3">
                        Output Folder
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={outputPath}
                          onChange={(e) => setOutputPath(e.target.value)}
                          placeholder={settings.outputPath || 'Default downloads folder'}
                          className="w-full px-4 py-3 pr-12 bg-slate-700/70 border border-slate-600/50 rounded-lg text-lime-400 placeholder-white/40 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all duration-200 hover:bg-slate-600/70 shadow-[0_0_0_1px_rgba(132,204,22,0.1)] focus:shadow-[0_0_20px_rgba(132,204,22,0.3)] [text-shadow:0_0_8px_rgba(132,204,22,0.6)]"
                        />
                        <button
                          onClick={handleSelectFolder}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-lime-500/20 text-white/60 hover:text-lime-400 transition-colors"
                          title="Select folder"
                          type="button"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-slate-600/50">
                    <button
                      onClick={handleAddToQueue}
                      disabled={isAddingDownload || isStartingDownload}
                      className="px-6 py-3 rounded-lg bg-slate-600/50 hover:bg-slate-500/50 text-white/90 hover:text-white transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-500/30 hover:border-slate-400/50"
                    >
                      {isAddingDownload ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-4 h-4" />
                          <span>Add to Queue</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleStartDownload}
                      disabled={isStartingDownload || isAddingDownload}
                      className="px-8 py-3 rounded-lg bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white font-semibold transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-lime-500/25"
                    >
                      {isStartingDownload ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Starting...</span>
                        </>
                      ) : (
                        <>
                          <DownloadIcon className="w-4 h-4" />
                          <span>Download Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </OptimizedMotionDiv>
          )}
        </div>
      </div>

      {/* Active Downloads List */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <OptimizedAnimatePresence>
          {activeDownloads.length === 0 ? (
            <OptimizedMotionDiv
              variants={{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -20 }
              }}
              className="text-center py-12"
            >
              <Download className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white/80 mb-2">
                No active downloads
              </h3>
              <p className="text-white/50">
                Paste a URL above to start downloading
              </p>
            </OptimizedMotionDiv>
          ) : (
            <div className="space-y-6">
              {/* Currently Downloading */}
              {downloadingItems.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <DownloadIcon className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">Active Downloads</h2>
                    <span className="text-sm text-white/60">({downloadingItems.length})</span>
                  </div>
                  <VirtualizedDownloadsList
                    downloads={downloadingItems}
                    onPause={handlePause}
                    onResume={handleResume}
                    onRetry={handleRetry}
                    onRemove={handleRemove}
                    containerHeight={400}
                    itemHeight={140}
                  />
                </div>
              )}

              {/* Recently Completed */}
              {completedItems.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-700/50 bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-lime-400" />
                    <h2 className="text-lg font-semibold text-white">Recently Completed</h2>
                    <span className="text-sm text-white/60">({completedItems.length})</span>
                  </div>
                  <div className="space-y-4">
                    {completedItems.map((download, index) => (
                      <div
                        key={download.id}
                        className="relative group"
                        style={{ 
                          zIndex: completedItems.length - index,
                          animationDelay: `${index * 0.1}s`
                        }}
                      >
                        <OptimizedMotionDiv
                          variants="slideUp"
                          className="relative transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                        >
                          <DownloadCard
                            download={download}
                            onPause={handlePause}
                            onResume={handleResume}
                            onRetry={handleRetry}
                            onRemove={handleRemove}
                          />
                        </OptimizedMotionDiv>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </OptimizedAnimatePresence>
        
        {/* Performance optimization: Pagination component */}
        {paginationInfo.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={paginationInfo.currentPage}
              totalPages={paginationInfo.totalPages}
              totalItems={paginationInfo.totalItems}
              pageSize={paginationInfo.pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsView;