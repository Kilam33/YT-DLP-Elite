import React from 'react';
import { Loader2, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';

// Skeleton loader for download cards
export const DownloadCardSkeleton: React.FC = () => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 animate-pulse">
    <div className="flex items-start space-x-4">
      {/* Thumbnail skeleton */}
      <div className="w-16 h-12 bg-slate-700/50 rounded flex-shrink-0"></div>
      
      {/* Content skeleton */}
      <div className="flex-1 min-w-0">
        {/* Title skeleton */}
        <div className="h-4 bg-slate-700/50 rounded mb-2 w-3/4"></div>
        
        {/* Progress bar skeleton */}
        <div className="w-full bg-slate-700/30 rounded-full h-2 mb-3">
          <div className="bg-lime-500/50 h-2 rounded-full w-1/3 animate-pulse"></div>
        </div>
        
        {/* Status and info skeleton */}
        <div className="flex items-center space-x-4">
          <div className="h-3 bg-slate-700/50 rounded w-16"></div>
          <div className="h-3 bg-slate-700/50 rounded w-20"></div>
          <div className="h-3 bg-slate-700/50 rounded w-24"></div>
        </div>
      </div>
      
      {/* Action buttons skeleton */}
      <div className="flex space-x-2">
        <div className="w-8 h-8 bg-slate-700/50 rounded"></div>
        <div className="w-8 h-8 bg-slate-700/50 rounded"></div>
      </div>
    </div>
  </div>
);

// Loading spinner component
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; message?: string }> = ({ 
  size = 'md', 
  message = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-lime-500`} />
      {message && (
        <p className="text-sm text-white/60">{message}</p>
      )}
    </div>
  );
};

// Loading overlay for modals and forms
export const LoadingOverlay: React.FC<{ 
  isVisible: boolean; 
  message?: string;
  backdrop?: boolean;
}> = ({ isVisible, message = 'Loading...', backdrop = true }) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${
      backdrop ? 'bg-black/50 backdrop-blur-sm' : ''
    }`}>
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-xl">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  );
};

// Skeleton for metadata preview
export const MetadataPreviewSkeleton: React.FC = () => (
  <div className="p-6 bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-xl border border-slate-600/50 shadow-lg animate-pulse">
    <div className="flex space-x-4 mb-6">
      {/* Thumbnail skeleton */}
      <div className="w-24 h-18 bg-slate-700/50 rounded flex-shrink-0"></div>
      
      {/* Info skeleton */}
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-slate-700/50 rounded mb-3 w-3/4"></div>
        <div className="h-4 bg-slate-700/50 rounded mb-2 w-1/2"></div>
        <div className="h-4 bg-slate-700/50 rounded mb-2 w-2/3"></div>
        <div className="flex space-x-4 mt-3">
          <div className="h-6 bg-slate-700/50 rounded w-16"></div>
          <div className="h-6 bg-slate-700/50 rounded w-20"></div>
        </div>
      </div>
    </div>
    
    {/* Quality selection skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="h-4 bg-slate-700/50 rounded mb-3 w-24"></div>
        <div className="h-12 bg-slate-700/50 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-slate-700/50 rounded mb-3 w-20"></div>
        <div className="h-12 bg-slate-700/50 rounded"></div>
      </div>
    </div>
  </div>
);

// Loading state for empty downloads
export const EmptyDownloadsState: React.FC<{ isLoading?: boolean }> = ({ isLoading = false }) => (
  <div className="text-center py-12">
    {isLoading ? (
      <LoadingSpinner size="lg" message="Loading downloads..." />
    ) : (
      <>
        <Download className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white/80 mb-2">
          No active downloads
        </h3>
        <p className="text-white/50">
          Paste a URL above to start downloading
        </p>
      </>
    )}
  </div>
);

// Loading state for queue
export const QueueLoadingState: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-slate-700/50 rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-700/50 rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
          </div>
          <div className="w-8 h-8 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

// Loading state for logs
export const LogsLoadingState: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-slate-700/50 rounded-full"></div>
          <div className="flex-1">
            <div className="h-3 bg-slate-700/50 rounded mb-1 w-1/4"></div>
            <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Progress indicator for downloads
export const DownloadProgressIndicator: React.FC<{ 
  progress: number; 
  status: string;
  speed?: string;
  eta?: string;
}> = ({ progress, status, speed, eta }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'downloading':
        return <Download className="w-4 h-4 text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-lime-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'paused':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-lime-400" />;
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {getStatusIcon()}
      <div className="flex-1">
        <div className="flex justify-between text-sm text-white/60 mb-1">
          <span>{status}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-700/30 rounded-full h-2">
          <div 
            className="bg-lime-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {(speed || eta) && (
          <div className="flex justify-between text-xs text-white/40 mt-1">
            {speed && <span>{speed}</span>}
            {eta && <span>ETA: {eta}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// Inline loading indicator
export const InlineLoading: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex items-center space-x-2 text-sm text-white/60">
    <Loader2 className="w-4 h-4 animate-spin text-lime-400" />
    <span>{message || 'Loading...'}</span>
  </div>
); 