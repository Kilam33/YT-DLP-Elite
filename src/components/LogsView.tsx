import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { clearLogs, setLogFilter } from '../store/slices/uiSlice';
import { FileText, Filter, Trash2, Info, AlertTriangle, XCircle, Bug, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const LogsView: React.FC = () => {
  const dispatch = useDispatch();
  const { logs, logFilter } = useSelector((state: RootState) => state.ui);

  const handleClearLogs = () => {
    dispatch(clearLogs());
    toast.success('Logs cleared');
  };

  const handleFilterChange = (filter: 'all' | 'info' | 'warning' | 'error' | 'debug') => {
    dispatch(setLogFilter(filter));
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-purple-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'border-blue-500/30 bg-blue-500/5';
      case 'warning':
        return 'border-orange-500/30 bg-orange-500/5';
      case 'error':
        return 'border-red-500/30 bg-red-500/5';
      case 'debug':
        return 'border-purple-500/30 bg-purple-500/5';
      default:
        return 'border-slate-700/50 bg-slate-800/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter logs based on selected filter
  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    return log.level === logFilter;
  });

  const filterOptions = [
    { key: 'all', label: 'All', count: logs.length },
    { key: 'info', label: 'Info', count: logs.filter(l => l.level === 'info').length },
    { key: 'warning', label: 'Warning', count: logs.filter(l => l.level === 'warning').length },
    { key: 'error', label: 'Error', count: logs.filter(l => l.level === 'error').length },
    { key: 'debug', label: 'Debug', count: logs.filter(l => l.level === 'debug').length },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-6 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
              <FileText className="w-6 h-6 text-lime-400" />
              <span>System Logs</span>
            </h1>
            <p className="text-white/60 mt-1">Monitor application activity and debug issues</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearLogs}
              className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-1">
          {filterOptions.map((option) => {
            const isActive = logFilter === option.key;
            
            return (
              <button
                key={option.key}
                onClick={() => handleFilterChange(option.key as any)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2
                  ${isActive 
                    ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30' 
                    : 'bg-slate-800/50 text-white/60 hover:text-white hover:bg-slate-700/50'
                  }
                `}
              >
                {getLevelIcon(option.key)}
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

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <AnimatePresence>
          {filteredLogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white/80 mb-2">
                {logFilter === 'all' ? 'No logs yet' : `No ${logFilter} logs`}
              </h3>
              <p className="text-white/50">
                {logFilter === 'all' 
                  ? 'Application logs will appear here' 
                  : `No ${logFilter} level logs found`
                }
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`
                    p-4 rounded-lg border backdrop-blur-xl transition-all duration-300
                    ${getLevelColor(log.level)}
                  `}
                >
                  <div className="flex items-start space-x-3">
                    {/* Level Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getLevelIcon(log.level)}
                    </div>
                    
                    {/* Log Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-white">
                            {log.level.toUpperCase()}
                          </span>
                          {log.downloadId && (
                            <span className="text-xs text-white/60 bg-slate-700/50 px-2 py-0.5 rounded">
                              Download: {log.downloadId.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-white/60">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                          <span>•</span>
                          <span>{formatDate(log.timestamp)}</span>
                        </div>
                      </div>
                      
                      <p className="text-white/90 text-sm leading-relaxed">
                        {log.message}
                      </p>
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

export default LogsView;