
import React, { useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { MediaModal } from '../media/MediaModal';

interface ImageFieldProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export const ImageField: React.FC<ImageFieldProps> = ({
  value,
  onChange,
  readOnly
}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (items: any[]) => {
    if (items.length > 0) {
      onChange(items[0].url);
    }
  };

  return (
    <div className="space-y-3">
      <div 
        onClick={() => !readOnly && setIsModalOpen(true)}
        className={cn(
          "block aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden group hover:border-accent transition-colors cursor-pointer relative",
          readOnly && "cursor-not-allowed opacity-70 hover:border-slate-200"
        )}
      >
        {value ? (
          <>
            <img src={value} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            {!readOnly && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-accent px-3 py-1.5 rounded-lg shadow-lg">
                  {t('settings.change_image')}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-slate-300 group-hover:text-accent transition-colors" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {t('settings.select_image')}
            </span>
          </div>
        )}
      </div>

      {!readOnly && value && (
        <button 
          type="button"
          onClick={() => onChange('')}
          className="w-full py-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <X className="w-3.5 h-3.5" />
          {t('settings.remove_image')}
        </button>
      )}

      <MediaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        multiSelect={false}
      />
    </div>
  );
};
