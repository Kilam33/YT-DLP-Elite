import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { LazyDownloadsView, LazyHistoryView, LazyQueueView, LazyLogsView, LazyMetadataModal } from './LazyViews';
import SettingsModal from './SettingsModal';

const MainContent: React.FC = () => {
  const activeView = useSelector((state: RootState) => state.ui.activeView);
  const { isMetadataOpen, selectedMetadata } = useSelector((state: RootState) => state.ui);
  const { isOpen: isSettingsOpen } = useSelector((state: RootState) => state.settings);

  const renderView = () => {
    switch (activeView) {
      case 'downloads':
        return <LazyDownloadsView />;
      case 'queue':
        return <LazyQueueView />;
      case 'history':
        return <LazyHistoryView />;
      case 'logs':
        return <LazyLogsView />;
      default:
        return <LazyDownloadsView />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {renderView()}
      
      {/* Modals - Lazy loaded for better performance */}
      {isMetadataOpen && (
        <LazyMetadataModal 
          isOpen={isMetadataOpen} 
          onClose={() => {}} 
          metadata={selectedMetadata} 
        />
      )}
      
      {/* Settings Modal - Direct import since it manages its own state */}
      <SettingsModal />
    </div>
  );
};

export default MainContent;