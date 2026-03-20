
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload, Image as ImageIcon, Search, X, Check, Trash2, Info, FileText, Loader2, Grid, List, Calendar, ChevronLeft, ChevronRight, Edit2, Save, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { mediaService, MediaItem } from '../../services/mediaService';
import { useCRMStore } from '../../store/useStore';
import { MediaSkeleton } from '../Skeleton';

interface MediaManagerProps {
  onSelect?: (items: MediaItem[]) => void;
  multiSelect?: boolean;
  selectedIds?: string[];
  onClose?: () => void;
  isModal?: boolean;
}

type ViewMode = 'grid' | 'list';
type DateFilter = 'all' | 'today' | 'this-month' | 'this-year';

export const MediaManager: React.FC<MediaManagerProps> = ({
  onSelect,
  multiSelect = false,
  selectedIds = [],
  onClose,
  isModal = false
}) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // URL Params / State
  const initialPage = Number(searchParams.get('page')) || 1;
  const initialSearch = searchParams.get('search') || '';
  const initialDateFilter = (searchParams.get('dateFilter') as DateFilter) || 'all';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [dateFilter, setDateFilter] = useState<DateFilter>(initialDateFilter);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number }[]>([]);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Settings
  const settings = useCRMStore(state => state.settingsData);
  const mediaSettings = settings?.tabs?.find((t: any) => t.id === 'media')?.sections?.[0]?.fields;
  const infiniteScrollEnabled = mediaSettings?.find((f: any) => f.name === 'mediaInfiniteScroll')?.value ?? true;
  const itemsPerPageSetting = Number(mediaSettings?.find((f: any) => f.name === 'mediaItemsPerPage')?.value ?? 12);

  // Pagination & Load More
  const [itemsToShow, setItemsToShow] = useState(itemsPerPageSetting);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = itemsPerPageSetting;

  const observerTarget = useRef<HTMLDivElement>(null);

  // Editing
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchMedia = useCallback(async (page: number, search: string, filter: string) => {
    setIsLoading(true);
    try {
      const response = await mediaService.getMedia({
        page,
        limit: itemsPerPage,
        search,
        dateFilter: filter
      });
      setMedia(response.media);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch media', error);
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage]);

  // Sync state with URL params
  useEffect(() => {
    if (!isModal) {
      const page = Number(searchParams.get('page')) || 1;
      const search = searchParams.get('search') || '';
      const filter = (searchParams.get('dateFilter') as DateFilter) || 'all';
      
      setCurrentPage(page);
      setSearchQuery(search);
      setDateFilter(filter);
      fetchMedia(page, search, filter);
    } else {
      fetchMedia(currentPage, searchQuery, dateFilter);
    }
  }, [searchParams, isModal, fetchMedia]);

  const updateParams = (updates: Record<string, string | number>) => {
    if (isModal) return;
    
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === 'all' || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value.toString());
      }
    });
    setSearchParams(newParams);
  };

  const handlePageChange = (page: number) => {
    if (isModal) {
      setCurrentPage(page);
      fetchMedia(page, searchQuery, dateFilter);
    } else {
      updateParams({ page });
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!isModal) {
      // Debounce would be better, but for now simple update
      const timer = setTimeout(() => {
        updateParams({ search: query, page: 1 });
      }, 500);
      return () => clearTimeout(timer);
    }
  };

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
    if (isModal) {
      setCurrentPage(1);
      fetchMedia(1, searchQuery, filter);
    } else {
      updateParams({ dateFilter: filter, page: 1 });
    }
  };

  useEffect(() => {
    if (selectedIds.length > 0 && media.length > 0) {
      const initialSelected = media.filter(m => selectedIds.includes(m.id));
      setSelectedItems(initialSelected);
    }
  }, [selectedIds, media]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const newUploads = files.map(f => ({ name: f.name, progress: 0 }));
    setUploadingFiles(prev => [...prev, ...newUploads]);

    for (const file of files) {
      try {
        const uploaded = await mediaService.uploadMedia(file);
        setMedia(prev => [uploaded, ...prev]);
        setUploadingFiles(prev => prev.filter(u => u.name !== file.name));
        setActiveTab('library');
        if (!multiSelect) {
          setSelectedItems([uploaded]);
          setPreviewItem(uploaded);
        }
      } catch (error) {
        console.error('Upload failed', error);
        setUploadingFiles(prev => prev.filter(u => u.name !== file.name));
      }
    }
  };

  const toggleSelect = (item: MediaItem) => {
    if (multiSelect) {
      setSelectedItems(prev => {
        const isSelected = prev.some(m => m.id === item.id);
        if (isSelected) {
          return prev.filter(m => m.id !== item.id);
        } else {
          return [...prev, item];
        }
      });
    } else {
      setSelectedItems([item]);
    }
    setPreviewItem(item);
    if (!isModal) {
      setShowDetailModal(true);
    }
    setIsEditing(false);
    setEditName(item.name);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('media.deleteConfirm'))) return;
    
    try {
      await mediaService.deleteMedia(id);
      setMedia(prev => prev.filter(m => m.id !== id));
      setSelectedItems(prev => prev.filter(m => m.id !== id));
      if (previewItem?.id === id) setPreviewItem(null);
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  const handleUpdate = async () => {
    if (!previewItem || !editName.trim()) return;
    setIsUpdating(true);
    try {
      const updated = await mediaService.updateMedia(previewItem.id, { name: editName });
      setMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
      setPreviewItem(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPreviewContent = (item: MediaItem) => (
    <div className="p-6 space-y-6">
      <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
        <img src={item.url} alt={item.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">{t('media.fileName')}</label>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                autoFocus
              />
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="p-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between group/name">
              <p className="text-sm font-bold text-slate-700 truncate">{item.name}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-slate-400 hover:text-accent opacity-0 group-hover/name:opacity-100 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('media.type')}</label>
            <p className="text-xs font-medium text-slate-600 capitalize">{item.type}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('media.size')}</label>
            <p className="text-xs font-medium text-slate-600">{formatSize(item.size)}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('media.created')}</label>
            <p className="text-xs font-medium text-slate-600">{new Date(item.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('media.dimensions')}</label>
            <p className="text-xs font-medium text-slate-600">{item.dimensions || 'N/A'}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={(e) => handleDelete(item.id, e)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {t('media.deleteFile')}
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            <FileText className="w-4 h-4" />
            {t('media.viewFull')}
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn(
      "flex flex-col bg-white overflow-hidden transition-all duration-300",
      isModal 
        ? "h-[85vh] w-full max-w-6xl rounded-2xl shadow-2xl" 
        : "h-full w-full rounded-none border-none shadow-none"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-6 py-5 border-b border-slate-100",
        !isModal && "bg-slate-50/30"
      )}>
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('media.title')}</h2>
            {!isModal && (
              <p className="text-xs text-slate-400 font-medium mt-0.5">{t('media.subtitle')}</p>
            )}
          </div>
          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('upload')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                activeTab === 'upload' ? "bg-white text-accent shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t('media.upload')}
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                activeTab === 'library' ? "bg-white text-accent shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t('media.library')}
            </button>
          </div>
        </div>
        {isModal && onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'upload' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
              <label className="w-full max-w-md aspect-video border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group">
                <input type="file" multiple className="sr-only" onChange={handleUpload} />
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-accent transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">{t('media.dropFiles')}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('media.browseFiles')}</p>
                </div>
              </label>

              {uploadingFiles.length > 0 && (
                <div className="mt-8 w-full max-w-md space-y-3">
                  {uploadingFiles.map((file, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-100">
                      <Loader2 className="w-4 h-4 text-accent animate-spin" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                        <div className="h-1 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-accent animate-pulse w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('media.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      viewMode === 'grid' ? "bg-accent/10 text-accent" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      viewMode === 'list' ? "bg-accent/10 text-accent" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <select
                    value={dateFilter}
                    onChange={(e) => handleDateFilterChange(e.target.value as DateFilter)}
                    className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
                  >
                    <option value="all">{t('media.dateFilters.all')}</option>
                    <option value="today">{t('media.dateFilters.today')}</option>
                    <option value="this-month">{t('media.dateFilters.thisMonth')}</option>
                    <option value="this-year">{t('media.dateFilters.thisYear')}</option>
                  </select>
                </div>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {t('media.itemsCount', { count: totalItems })}
                </span>
              </div>

              {/* Grid/List Content */}
              <div className="flex-1 overflow-y-auto p-6 pb-24 custom-scrollbar">
                {isLoading ? (
                  <MediaSkeleton viewMode={viewMode} />
                ) : media.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                      <ImageIcon className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">{t('media.noMediaFound')}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('media.tryDifferentSearch')}</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {media.map((item) => {
                        const isSelected = selectedItems.some(m => m.id === item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleSelect(item)}
                            className={cn(
                              "group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
                              isSelected ? "border-accent ring-4 ring-accent/10" : "border-transparent hover:border-slate-200"
                            )}
                          >
                            <img
                              src={item.thumbnail}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            
                            <div className={cn(
                              "absolute inset-0 bg-accent/10 transition-opacity",
                              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )} />

                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-accent text-white rounded-lg flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
                                <Check className="w-4 h-4" />
                              </div>
                            )}

                            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-[10px] text-white font-bold truncate">{item.name}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {isModal && !infiniteScrollEnabled && itemsToShow < totalItems && (
                      <div className="flex justify-center pt-4">
                        <button
                          onClick={() => setItemsToShow(prev => prev + itemsPerPageSetting)}
                          className="px-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                        >
                          {t('media.loadMore')}
                        </button>
                      </div>
                    )}

                    {isModal && infiniteScrollEnabled && (
                      <div ref={observerTarget} className="h-10 flex items-center justify-center">
                        {itemsToShow < totalItems && (
                          <Loader2 className="w-6 h-6 text-accent animate-spin" />
                        )}
                      </div>
                    )}

                    {!isModal && totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-8">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-accent disabled:opacity-50 transition-all"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        {getPageNumbers().map((page, idx) => (
                          <button
                            key={idx}
                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                            className={cn(
                              "min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all",
                              currentPage === page 
                                ? "bg-accent text-white shadow-lg shadow-accent/20" 
                                : page === '...' 
                                  ? "text-slate-400 cursor-default"
                                  : "bg-white border border-slate-200 text-slate-600 hover:border-accent hover:text-accent"
                            )}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-accent disabled:opacity-50 transition-all"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('media.preview')}</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('media.fileName')}</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('media.created')}</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('media.size')}</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{t('media.actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {media.map((item) => {
                            const isSelected = selectedItems.some(m => m.id === item.id);
                            return (
                              <tr 
                                key={item.id}
                                onClick={() => toggleSelect(item)}
                                className={cn(
                                  "hover:bg-slate-50 transition-colors cursor-pointer group",
                                  isSelected && "bg-accent/5"
                                )}
                              >
                                <td className="px-4 py-2">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200">
                                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{item.name}</p>
                                </td>
                                <td className="px-4 py-2">
                                  <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()}</p>
                                </td>
                                <td className="px-4 py-2">
                                  <p className="text-xs text-slate-500">{formatSize(item.size)}</p>
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <button
                                    onClick={(e) => handleDelete(item.id, e)}
                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-8">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-accent disabled:opacity-50 transition-all"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        {getPageNumbers().map((page, idx) => (
                          <button
                            key={idx}
                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                            className={cn(
                              "min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all",
                              currentPage === page 
                                ? "bg-accent text-white shadow-lg shadow-accent/20" 
                                : page === '...' 
                                  ? "text-slate-400 cursor-default"
                                  : "bg-white border border-slate-200 text-slate-600 hover:border-accent hover:text-accent"
                            )}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-accent disabled:opacity-50 transition-all"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar / Preview (Only for Modal) */}
        {isModal && (
          <div className="w-80 bg-slate-50/50 overflow-y-auto custom-scrollbar flex flex-col border-l border-slate-100">
            {previewItem ? renderPreviewContent(previewItem) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Info className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('media.selectItem')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal (Only for Page View) */}
      <AnimatePresence>
        {!isModal && showDetailModal && previewItem && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">{t('media.details')}</h3>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                {renderPreviewContent(previewItem)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer (only for modal) */}
      {isModal && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            {selectedItems.length > 0 && (
              <span className="text-xs font-bold text-slate-500">
                {t('media.selectedCount', { count: selectedItems.length })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              {t('media.cancel')}
            </button>
            <button
              disabled={selectedItems.length === 0}
              onClick={() => onSelect?.(selectedItems)}
              className="px-8 py-2.5 bg-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {t('media.select')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
