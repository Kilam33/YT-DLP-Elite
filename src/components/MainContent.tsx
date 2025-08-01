import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import DownloadsView from './DownloadsView';
import QueueView from './QueueView';
import HistoryView from './HistoryView';
import LogsView from './LogsView';
import MetadataModal from './MetadataModal';
import SettingsModal from './SettingsModal';

const MainContent: React.FC = () => {
  const activeView = useSelector((state: RootState) => state.ui.activeView);

  const renderView = () => {
    switch (activeView) {
      case 'downloads':
        return <DownloadsView />;
      case 'queue':
        return <QueueView />;
      case 'history':
        return <HistoryView />;
      case 'logs':
        return <LogsView />;
      default:
        return <DownloadsView />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {renderView()}
      
      {/* Modals */}
      <MetadataModal />
      <SettingsModal />
    </div>
  );
};

export default MainContent;