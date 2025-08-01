import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setFilter, setSearchQuery, clearCompleted, formatDownloadDate } from '../store/slices/downloadsSlice';
import { History, Search, Filter, Trash2, Play, Clock, User, Eye, CheckCircle, XCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const HistoryView: React.FC = () => {
  const dispatch = useDispatch();
  const { items: downloads, filter, searchQuery } = useSelector((state: RootState) => state.downloads);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      if (window.electronAPI) {
        const downloadsData = await window.electronAPI.getDownloads();
        // Filter to show only completed downloads in history
        const completedDownloads = downloadsData.filter(d => d.status === 'completed' || d.status === 'error');
        // Update the store with completed downloads for history view
        // Note: This is a simplified approach - in a real app you might want separate history state
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await window.electronAPI?.clearCompleted();
      dispatch(clearCompleted());
      toast.success('History cleared');
    } catch (error) {
      toast.error('Failed to clear history');
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter completed downloads for history
  const completedDownloads = downloads.filter(d => d.status === 'completed' || d.status === 'error');
  
  // Apply search and filter
  const filteredDownloads = completedDownloads.filter(download => {
    // Filter by status
    if (filter === 'completed' && download.status !== 'completed') {
      return false;
    }
    if (filter === 'failed' && download.status !== 'error') {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        download.filename?.toLowerCase().includes(query) ||
        download.url.toLowerCase().includes(query) ||
        (download.metadata?.title && download.metadata.title.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const getFilterCounts = () => {
    return {
      all: completedDownloads.length,
      completed: completedDownloads.filter(d => d.status === 'completed').length,
      failed: completedDownloads.filter(d => d.status === 'error').length,
    };
  };

  const filterCounts = getFilterCounts();

  const filterOptions = [
    { key: 'all', label: 'All History', count: filterCounts.all, icon: History },
    { key: 'completed', label: 'Completed', count: filterCounts.completed, icon: CheckCircle },
    { key: 'failed', label: 'Failed', count: filterCounts.failed, icon: XCircle },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-white/60">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-6 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <History className="w-6 h-6 text-lime-400" />
            <span>Download History</span>
          </h1>
          {completedDownloads.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors flex items-center space-x-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          )}
        </div>
        
        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-lime-500 transition-colors"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center space-x-1">
            {filterOptions.map((option) => {
              const Icon = option.icon;
              const isActive = filter === option.key;
              
              return (
                <button
                  key={option.key}
                  onClick={() => dispatch(setFilter(option.key as any))}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2
                    ${isActive 
                      ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30' 
                      : 'bg-slate-800/50 text-white/60 hover:text-white hover:bg-slate-700/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                  {option.count > 0 && (
                    <span className={`
                      px-1.5 py-0.5 text-xs rounded-full
                      ${isActive ? 'bg-lime-500 text-white' : 'bg-slate-600 text-white/80'}
                    `}>
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredDownloads.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <History className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white/80 mb-2">
                {searchQuery || filter !== 'all' ? 'No matching downloads' : 'No history yet'}
              </h3>
              <p className="text-white/50">
                {searchQuery || filter !== 'all' ? 'Try adjusting your search terms or filters' : 'Completed downloads will appear here'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <AnimatePresence>
              {filteredDownloads.map((download) => (
                <motion.div
                  key={download.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {download.status === 'completed' ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    
                    {/* Download Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">
                            {download.filename || download.metadata?.title || 'Unknown file'}
                          </h3>
                          <p className="text-white/60 text-xs mb-2">
                            {download.url}
                          </p>
                          
                          {/* Metadata */}
                          {download.metadata && (
                            <div className="flex items-center space-x-4 text-xs text-white/60 mb-2">
                              {download.metadata.uploader && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span>{download.metadata.uploader}</span>
                                </div>
                              )}
                              {download.metadata.duration && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDuration(download.metadata.duration)}</span>
                                </div>
                              )}
                              {download.metadata.view_count && (
                                <div className="flex items-center space-x-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{download.metadata.view_count.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* File Info */}
                          <div className="flex items-center space-x-4 text-xs text-white/50">
                            <span>Quality: {download.quality}</span>
                            {download.filesize > 0 && (
                              <span>Size: {formatFileSize(download.filesize)}</span>
                            )}
                            {download.completedAt && (
                              <span>Completed: {formatDownloadDate(download.completedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  {download.status === 'error' && download.error && (
                    <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300">
                      {download.error}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;