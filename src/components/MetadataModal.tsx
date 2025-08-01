import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { closeMetadataModal } from '../store/slices/uiSlice';
import { X, Play, Eye, Calendar, User, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize, formatDuration, formatDate } from '../utils/format';

const MetadataModal: React.FC = () => {
  const dispatch = useDispatch();
  const { isMetadataModalOpen, selectedMetadata } = useSelector((state: RootState) => state.ui);

  if (!isMetadataModalOpen || !selectedMetadata) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white">Video Details</h2>
            <button
              onClick={() => dispatch(closeMetadataModal())}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            {/* Thumbnail and Basic Info */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {selectedMetadata.thumbnail && (
                <div className="flex-shrink-0">
                  <img
                    src={selectedMetadata.thumbnail}
                    alt="Thumbnail"
                    className="w-full md:w-48 h-32 object-cover rounded-lg border border-slate-700/50"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                  {selectedMetadata.title}
                </h3>
                
                <div className="space-y-2 text-sm">
                  {selectedMetadata.uploader && (
                    <div className="flex items-center space-x-2 text-white/70">
                      <User className="w-4 h-4" />
                      <span>{selectedMetadata.uploader}</span>
                    </div>
                  )}
                  
                  {selectedMetadata.duration && (
                    <div className="flex items-center space-x-2 text-white/70">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(selectedMetadata.duration)}</span>
                    </div>
                  )}
                  
                  {selectedMetadata.view_count && (
                    <div className="flex items-center space-x-2 text-white/70">
                      <Eye className="w-4 h-4" />
                      <span>{selectedMetadata.view_count.toLocaleString()} views</span>
                    </div>
                  )}
                  
                  {selectedMetadata.upload_date && (
                    <div className="flex items-center space-x-2 text-white/70">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedMetadata.upload_date}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedMetadata.description && (
              <div className="mb-6">
                <h4 className="text-white font-medium mb-2">Description</h4>
                <div className="bg-slate-700/30 rounded-lg p-4 text-white/80 text-sm max-h-32 overflow-y-auto">
                  {selectedMetadata.description}
                </div>
              </div>
            )}

            {/* Available Formats */}
            {selectedMetadata.formats && selectedMetadata.formats.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3">Available Formats</h4>
                <div className="space-y-2">
                  {selectedMetadata.formats.map((format: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Play className="w-4 h-4 text-lime-400" />
                        <div>
                          <span className="text-white font-medium">
                            {format.height ? `${format.height}p` : 'Audio Only'}
                          </span>
                          <span className="text-white/60 text-sm ml-2">
                            {format.ext?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      {format.filesize && (
                        <span className="text-white/60 text-sm">
                          {formatFileSize(format.filesize)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MetadataModal;