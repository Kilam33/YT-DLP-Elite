import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { 
  addToQueue, 
  removeFromQueue, 
  reorderQueue, 
  clearQueue, 
  setProcessing 
} from '../store/slices/queueSlice';
import { updateDownload } from '../store/slices/downloadsSlice';
import { addLog } from '../store/slices/uiSlice';
import DownloadCard from './DownloadCard';
import { 
  Clock, 
  Play, 
  Pause, 
  MoveUp, 
  MoveDown, 
  Trash2,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const QueueView: React.FC = () => {
  const dispatch = useDispatch();
  const { items: queueIds, isProcessing } = useSelector((state: RootState) => state.queue);
  const { items: downloads } = useSelector((state: RootState) => state.downloads);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDownloads();
    
    // Set up download update listener
    if (window.electronAPI) {
      window.electronAPI.onDownloadUpdated((download) => {
        dispatch(updateDownload(download));
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeDownloadUpdateListener();
      }
    };
  }, [dispatch]);

  const loadDownloads = async () => {
    try {
      if (window.electronAPI) {
        const downloadsData = await window.electronAPI.getDownloads();
        // Update downloads in store
        dispatch(addLog({
          level: 'info',
          message: `Queue view loaded with ${queueIds.length} queued items`,
        }));
      }
    } catch (error) {
      console.error('Failed to load downloads:', error);
      toast.error('Failed to load downloads');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to load downloads in queue view',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQueue = async () => {
    try {
      await window.electronAPI?.startQueue();
      dispatch(setProcessing(true));
      toast.success('Queue processing started');
      dispatch(addLog({
        level: 'info',
        message: 'Queue processing started',
      }));
    } catch (error) {
      console.error('Failed to start queue:', error);
      toast.error('Failed to start queue');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to start queue processing',
      }));
    }
  };

  const handlePauseQueue = async () => {
    try {
      await window.electronAPI?.pauseQueue();
      dispatch(setProcessing(false));
      toast.success('Queue paused');
      dispatch(addLog({
        level: 'info',
        message: 'Queue processing paused',
      }));
    } catch (error) {
      console.error('Failed to pause queue:', error);
      toast.error('Failed to pause queue');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to pause queue processing',
      }));
    }
  };

  const handleRemoveFromQueue = async (id: string) => {
    try {
      await window.electronAPI?.removeDownload(id);
      dispatch(removeFromQueue(id));
      toast.success('Removed from queue');
      dispatch(addLog({
        level: 'info',
        message: 'Item removed from queue',
        downloadId: id,
      }));
    } catch (error) {
      console.error('Failed to remove from queue:', error);
      toast.error('Failed to remove from queue');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to remove item from queue',
        downloadId: id,
      }));
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      dispatch(reorderQueue({ from: index, to: index - 1 }));
      dispatch(addLog({
        level: 'info',
        message: `Moved queue item from position ${index + 1} to ${index}`,
      }));
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < queueIds.length - 1) {
      dispatch(reorderQueue({ from: index, to: index + 1 }));
      dispatch(addLog({
        level: 'info',
        message: `Moved queue item from position ${index + 1} to ${index + 2}`,
      }));
    }
  };

  const handleClearQueue = () => {
    try {
      dispatch(clearQueue());
      toast.success('Queue cleared');
      dispatch(addLog({
        level: 'info',
        message: 'Queue cleared',
      }));
    } catch (error) {
      console.error('Failed to clear queue:', error);
      toast.error('Failed to clear queue');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to clear queue',
      }));
    }
  };

  const handleStopAllDownloads = async () => {
    try {
      await window.electronAPI?.stopAllDownloads();
      dispatch(setProcessing(false));
      toast.success('All downloads stopped');
      dispatch(addLog({
        level: 'info',
        message: 'All downloads stopped',
      }));
    } catch (error) {
      console.error('Failed to stop all downloads:', error);
      toast.error('Failed to stop all downloads');
      dispatch(addLog({
        level: 'error',
        message: 'Failed to stop all downloads',
      }));
    }
  };

  // Get queued downloads by matching IDs and filter out undefined
  const queuedDownloads = queueIds
    .map(id => downloads.find(d => d.id === id))
    .filter((download): download is NonNullable<typeof download> => download !== undefined);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Clock className="w-6 h-6 text-lime-400" />
            <span>Download Queue</span>
          </h1>
          <div className="flex items-center space-x-2">
            {queuedDownloads.length > 0 && (
              <>
                {isProcessing ? (
                  <button
                    onClick={handlePauseQueue}
                    className="px-4 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 hover:text-orange-300 transition-colors flex items-center space-x-2"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause Queue</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartQueue}
                    className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Queue</span>
                  </button>
                )}
                <button
                  onClick={handleStopAllDownloads}
                  className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors flex items-center space-x-2"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop All</span>
                </button>
                <button
                  onClick={handleClearQueue}
                  className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Queue</span>
                </button>
              </>
            )}
          </div>
        </div>
        
        {queuedDownloads.length > 0 && (
          <div className="flex items-center space-x-4 text-sm text-white/60">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{queuedDownloads.length} items in queue</span>
            </div>
            {isProcessing && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                <span>Processing...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <AnimatePresence>
          {queuedDownloads.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white/80 mb-2">
                Queue is empty
              </h3>
              <p className="text-white/50">
                Downloads will appear here when added to queue
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {queuedDownloads.map((download, index) => (
                <motion.div
                  key={download.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative"
                >
                  {/* Queue Position Indicator */}
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-medium text-white/80 border-2 border-slate-600">
                    {index + 1}
                  </div>
                  
                  {/* Download Card with Queue Controls */}
                  <div className="ml-6">
                    <DownloadCard
                      download={download}
                      onPause={() => {}} // Queue items don't have pause/resume
                      onResume={() => {}} // Queue items don't have pause/resume
                      onRetry={() => {}} // Queue items don't have retry
                      onRemove={handleRemoveFromQueue}
                    />
                    
                    {/* Queue Controls */}
                    <div className="flex items-center justify-end space-x-2 mt-2">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === queuedDownloads.length - 1}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromQueue(download.id)}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QueueView;