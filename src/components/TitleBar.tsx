import React from 'react';
import { Minus, Square, X, Download } from 'lucide-react';

interface TitleBarProps {
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ onMinimize, onMaximize, onClose }) => {
  return (
    <div className="flex justify-between items-center h-8 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/50 drag-region select-none">
      {/* App Title */}
      <div className="flex items-center px-4 space-x-2">
        <Download className="w-4 h-4 text-lime-400" />
        <span className="text-sm font-semibold text-white">YT-DLP Elite</span>
      </div>
      
      {/* Window Controls */}
      <div className="flex">
        <button
          onClick={onMinimize}
          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors no-drag"
        >
          <Minus className="w-4 h-4 text-white/70" />
        </button>
        <button
          onClick={onMaximize}
          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors no-drag"
        >
          <Square className="w-3 h-3 text-white/70" />
        </button>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center hover:bg-red-500 transition-colors no-drag"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;