
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MediaManager } from './MediaManager';
import { MediaItem } from '../../services/mediaService';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: MediaItem[]) => void;
  multiSelect?: boolean;
  selectedIds?: string[];
}

export const MediaModal: React.FC<MediaModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  multiSelect = false,
  selectedIds = []
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-6xl h-full max-h-[90vh] flex flex-col"
          >
            <MediaManager
              isModal
              onClose={onClose}
              onSelect={(items) => {
                onSelect(items);
                onClose();
              }}
              multiSelect={multiSelect}
              selectedIds={selectedIds}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
