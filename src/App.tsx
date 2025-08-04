import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ErrorBoundary from './components/ErrorBoundary';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSettings } from './hooks/useSettings';
import './utils/logger'; // Initialize logger

const AppContent: React.FC = () => {
  useKeyboardShortcuts();
  useSettings(); // Load settings on startup

  const handleMinimize = async () => {
    await window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = async () => {
    await window.electronAPI?.maximizeWindow();
  };

  const handleClose = async () => {
    await window.electronAPI?.closeWindow();
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex flex-col">
      <TitleBar 
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={handleClose}
      />
      
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <MainContent />
      </div>
      
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#ffffff',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#84cc16',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <DndProvider backend={HTML5Backend}>
          <AppContent />
        </DndProvider>
      </ErrorBoundary>
    </Provider>
  );
}

export default App;