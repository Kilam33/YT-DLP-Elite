import React, { useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import DownloadCard from './DownloadCard';
import { Download } from '../store/slices/downloadsSlice';

interface VirtualizedDownloadsListProps {
  downloads: Download[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  itemHeight?: number;
  containerHeight?: number;
}

const VirtualizedDownloadsList: React.FC<VirtualizedDownloadsListProps> = ({
  downloads,
  onPause,
  onResume,
  onRetry,
  onRemove,
  itemHeight = 120, // Height of each download card
  containerHeight = 600, // Default container height
}) => {
  // Memoize the downloads array to prevent unnecessary re-renders
  const memoizedDownloads = useMemo(() => downloads, [downloads]);

  // Row renderer function for react-window
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const download = memoizedDownloads[index];
    
    if (!download) {
      return (
        <div style={style} className="p-2">
          <div className="h-20 bg-slate-700/30 rounded-lg animate-pulse"></div>
        </div>
      );
    }

    return (
      <div style={style} className="p-2">
        <DownloadCard
          download={download}
          onPause={onPause}
          onResume={onResume}
          onRetry={onRetry}
          onRemove={onRemove}
        />
      </div>
    );
  }, [memoizedDownloads, onPause, onResume, onRetry, onRemove]);

  // Memoize the row renderer to prevent unnecessary re-renders
  const memoizedRow = useMemo(() => Row, [Row]);

  // Empty state
  if (downloads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-white/60">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>No downloads to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="virtualized-list-container">
      <List
        height={containerHeight}
        itemCount={downloads.length}
        itemSize={itemHeight}
        width="100%"
        itemData={downloads}
        overscanCount={5} // Render 5 extra items for smooth scrolling
        className="virtualized-list"
        style={{
          // Custom scrollbar styles
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(99, 102, 241, 0.3) rgba(15, 23, 42, 0.3)',
        }}
      >
        {memoizedRow}
      </List>
    </div>
  );
};

export default VirtualizedDownloadsList; 