import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load components for better initial performance
const DownloadsView = React.lazy(() => import('./DownloadsView'));
const HistoryView = React.lazy(() => import('./HistoryView'));
const QueueView = React.lazy(() => import('./QueueView'));
const LogsView = React.lazy(() => import('./LogsView'));
const SettingsModal = React.lazy(() => import('./SettingsModal'));
const MetadataModal = React.lazy(() => import('./MetadataModal'));

// Loading fallback component
const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-lime-500" />
      <p className="text-white/60">{message}</p>
    </div>
  </div>
);

// Lazy DownloadsView wrapper
export const LazyDownloadsView: React.FC = () => (
  <Suspense fallback={<LoadingFallback message="Loading downloads..." />}>
    <DownloadsView />
  </Suspense>
);

// Lazy HistoryView wrapper
export const LazyHistoryView: React.FC = () => (
  <Suspense fallback={<LoadingFallback message="Loading history..." />}>
    <HistoryView />
  </Suspense>
);

// Lazy QueueView wrapper
export const LazyQueueView: React.FC = () => (
  <Suspense fallback={<LoadingFallback message="Loading queue..." />}>
    <QueueView />
  </Suspense>
);

// Lazy LogsView wrapper
export const LazyLogsView: React.FC = () => (
  <Suspense fallback={<LoadingFallback message="Loading logs..." />}>
    <LogsView />
  </Suspense>
);

// Lazy SettingsModal wrapper
export const LazySettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <Suspense fallback={<LoadingFallback message="Loading settings..." />}>
    <SettingsModal isOpen={isOpen} onClose={onClose} />
  </Suspense>
);

// Lazy MetadataModal wrapper
export const LazyMetadataModal: React.FC<{ isOpen: boolean; onClose: () => void; metadata: any }> = ({ isOpen, onClose, metadata }) => (
  <Suspense fallback={<LoadingFallback message="Loading metadata..." />}>
    <MetadataModal isOpen={isOpen} onClose={onClose} metadata={metadata} />
  </Suspense>
); 