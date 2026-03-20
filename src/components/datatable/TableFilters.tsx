
import React from 'react';
import { Icon } from '../Icon';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

import { motion, AnimatePresence } from 'motion/react';

interface TableFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    status: string;
    onStatusChange: (status: string) => void;
    statusOptions: { value: string; label: string }[];
    parentId: string;
    onParentIdChange: (id: string) => void;
    onReset: () => void;
    showReset: boolean;
    columns: { name: string; visible: boolean }[];
    onToggleColumn: (name: string) => void;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
    searchQuery,
    onSearchChange,
    status,
    onStatusChange,
    statusOptions,
    parentId,
    onParentIdChange,
    onReset,
    showReset,
    columns,
    onToggleColumn
}) => {
    const { t } = useTranslation();
    const [showColumnDropdown, setShowColumnDropdown] = React.useState(false);
    const [showFilters, setShowFilters] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowColumnDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-4">
            {/* Top Row: Search, Columns, and Toggle */}
            <div className="flex items-center justify-end gap-3">
                <div className="relative w-full max-w-[280px]">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder={t('datatable.search')}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-all"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                        className={cn(
                            "flex items-center gap-2 border rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200",
                            showColumnDropdown 
                                ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <Icon name="layout" className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('common.columns')}</span>
                        <Icon name="chevron-down" className={cn("w-3 h-3 transition-transform", showColumnDropdown && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                        {showColumnDropdown && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden"
                            >
                                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('common.available_columns')}</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {columns.map((col) => (
                                        <label 
                                            key={col.name}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <div className="relative flex items-center justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={col.visible}
                                                    onChange={() => onToggleColumn(col.name)}
                                                    className="peer sr-only"
                                                />
                                                <div className={cn(
                                                    "w-4 h-4 border-2 rounded transition-all duration-200 ease-in-out",
                                                    "border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600",
                                                    "peer-checked:border-accent",
                                                )}></div>
                                                <Icon 
                                                    name="check-circle" 
                                                    className="absolute w-2.5 h-2.5 text-accent opacity-0 peer-checked:opacity-100 transition-opacity" 
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-slate-600">{col.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "p-2 rounded-xl border transition-all duration-200 flex items-center justify-center",
                        showFilters 
                            ? "bg-accent/10 border-accent text-accent shadow-lg shadow-accent/5" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                    title={t('datatable.filterByStatus')}
                >
                    <Icon name="filter" className="w-5 h-5" />
                </button>
            </div>

            {/* Bottom Row: Filters (Collapsible) */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-6 flex-wrap p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('products.status')}:</span>
                                <select 
                                    value={status}
                                    onChange={(e) => onStatusChange(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/20"
                                >
                                    <option value="all">{t('datatable.allStatuses')}</option>
                                    {statusOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('datatable.filterByParent')}:</span>
                                <select 
                                    value={parentId}
                                    onChange={(e) => onParentIdChange(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/20"
                                >
                                    <option value="all">{t('datatable.allParents')}</option>
                                    {['P001', 'P002', 'P003'].map(id => (
                                        <option key={id} value={id}>{id}</option>
                                    ))}
                                </select>
                            </div>

                            {showReset && (
                                <button 
                                    onClick={onReset}
                                    className="text-[10px] font-bold text-accent hover:opacity-80 uppercase tracking-widest transition-opacity"
                                >
                                    {t('common.reset')}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
