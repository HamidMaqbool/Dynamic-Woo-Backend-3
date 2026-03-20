import React, { useState, useRef } from 'react';
import { X, Upload, GripVertical, Plus, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { MediaModal } from '../media/MediaModal';

interface GalleryFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  readOnly?: boolean;
}

export const GalleryField: React.FC<GalleryFieldProps> = ({ 
  value = [], 
  onChange, 
  max = 10, 
  readOnly 
}) => {
  const { t } = useTranslation();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dragTimeoutRef = useRef<any>(null);
  const lastReorderTimeRef = useRef<number>(0);

  const handleSelect = (items: any[]) => {
    const newUrls = items.map(item => item.url);
    const combined = [...value, ...newUrls];
    onChange(combined.slice(0, max));
  };

  const removeImage = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    e.preventDefault();
    
    // Prevent rapid back-and-forth reordering
    const now = Date.now();
    if (now - lastReorderTimeRef.current < 200) return;

    if (draggedIndex === null || draggedIndex === index) {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = null;
      }
      setDragOverIndex(null);
      return;
    }
    
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      
      dragTimeoutRef.current = setTimeout(() => {
        const newValue = [...value];
        const item = newValue.splice(draggedIndex, 1)[0];
        newValue.splice(index, 0, item);
        
        lastReorderTimeRef.current = Date.now();
        onChange(newValue);
        setDraggedIndex(index);
      }, 150);
    }
  };

  const onDrop = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    e.preventDefault();
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">{t('common.media')}</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {value.length} / {max} {t('media.images')}
          </span>
          {!readOnly && value.length < max && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-accent/20 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('common.add')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 auto-rows-fr">
        {value.map((url, index) => {
          const isFeatured = index === 0;
          const isDragging = draggedIndex === index;

          return (
            <motion.div 
              key={url}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                layout: { type: "spring", stiffness: 500, damping: 50, mass: 1 },
                opacity: { duration: 0.2 }
              }}
              draggable={!readOnly}
              onDragStart={(e) => onDragStart(e, index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDrop={(e) => onDrop(e, index)}
              onDragEnd={onDragEnd}
              className={cn(
                "relative group rounded-xl overflow-hidden border",
                isFeatured ? "col-span-2 row-span-2 aspect-square" : "aspect-square",
                isDragging ? "opacity-0" : "opacity-100",
                !readOnly && "hover:border-accent hover:shadow-md cursor-move border-slate-200"
              )}
            >
                <img 
                  src={url} 
                  alt="Gallery item" 
                  className="w-full h-full object-cover pointer-events-none" 
                  referrerPolicy="no-referrer" 
                />
                
                {!readOnly && (
                  <>
                    <div className="absolute top-2 left-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-accent">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                {isFeatured && (
                  <div className="absolute bottom-3 left-3 px-3 py-1 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                    {t('media.featured')}
                  </div>
                )}

                {!isFeatured && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/50 backdrop-blur-sm text-white text-[10px] font-bold rounded-md">
                    {index + 1}
                  </div>
                )}
              </motion.div>
            );
          })}

        {!readOnly && value.length < max && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 group hover:border-accent transition-colors cursor-pointer",
              value.length === 0 ? "col-span-2 row-span-2" : ""
            )}
          >
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-accent transition-colors" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('media.addMedia')}</span>
          </button>
        )}
      </div>

      {value.length === 0 && (
        <div className="py-16 border-2 border-dashed border-slate-100 rounded-2xl text-center bg-slate-50/30">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-slate-200" />
          </div>
          <p className="text-sm text-slate-500 font-bold">{t('media.noMediaUploaded')}</p>
          {!readOnly && (
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
              {t('media.clickToSelect')}
            </p>
          )}
        </div>
      )}

      <MediaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        multiSelect={true}
      />
    </div>
  );
};
