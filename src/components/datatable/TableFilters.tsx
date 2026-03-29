
import React from 'react';
import { Icon } from '../Icon';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

import { motion, AnimatePresence } from 'motion/react';

interface TableFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filters: Record<string, any>;
    onFilterChange: (filters: Partial<Record<string, any>>) => void;
    filtersConfig?: {
        search_input: boolean;
        columns: boolean;
        more_filters: {
            label: string;
            type: string;
            class?: string;
            options?: { label: string; value: string }[];
        }[];
    };
    onReset: () => void;
    showReset: boolean;
    columns: { name: string; visible: boolean }[];
    onToggleColumn: (name: string) => void;
}

const DelayedInput: React.FC<{
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
    icon?: string;
}> = ({ value, onChange, placeholder, className, type = "text", icon }) => {
    const [localValue, setLocalValue] = React.useState(value);

    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onChange(localValue);
            // Optional: blur the input on enter
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className="relative w-full">
            {icon && <Icon name={icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />}
            <input
                type={type}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={cn("w-full transition-all", className)}
            />
        </div>
    );
};

export const TableFilters: React.FC<TableFiltersProps> = ({
    searchQuery,
    onSearchChange,
    filters,
    onFilterChange,
    filtersConfig,
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

    const getWidthClass = (widthClass?: string) => {
        switch (widthClass) {
            case '1/4-width': return 'w-full sm:w-[calc(25%-12px)]';
            case '1/2-width': return 'w-full sm:w-[calc(50%-12px)]';
            case '3/4-width': return 'w-full sm:w-[calc(75%-12px)]';
            case 'full-width': return 'w-full';
            default: return 'w-full sm:w-auto';
        }
    };

    const renderFilterInput = (filter: any) => {
        const filterKey = filter.label.toLowerCase().replace(/\s+/g, '_');
        const value = filters[filterKey] || 'all';

        switch (filter.type) {
            case 'main':
                return (
                    <div key={filter.label} className={cn("flex flex-col gap-1.5", getWidthClass(filter.class))}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filter.label}</span>
                        <DelayedInput 
                            value={filters[filterKey] || ''}
                            onChange={(val) => onFilterChange({ [filterKey]: val })}
                            placeholder={filter.label}
                            icon="search"
                            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-xs"
                        />
                    </div>
                );
            case 'select':
                return (
                    <div key={filter.label} className={cn("flex flex-col gap-1.5", getWidthClass(filter.class))}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filter.label}</span>
                        <select 
                            value={value}
                            onChange={(e) => onFilterChange({ [filterKey]: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                            <option value="all">{t('common.all')} {filter.label}</option>
                            {filter.options?.map((opt: any) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                );
            case 'date-range':
                return (
                    <div key={filter.label} className={cn("flex flex-col gap-1.5", getWidthClass(filter.class))}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filter.label}</span>
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/20"
                                value={filters[`${filterKey}_start`] || ''}
                                onChange={(e) => onFilterChange({ [`${filterKey}_start`]: e.target.value })}
                            />
                            <span className="text-slate-400 text-xs">-</span>
                            <input 
                                type="date" 
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/20"
                                value={filters[`${filterKey}_end`] || ''}
                                onChange={(e) => onFilterChange({ [`${filterKey}_end`]: e.target.value })}
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Top Row: Search, Columns, and Toggle */}
            <div className="flex items-center justify-end gap-3">
                {(!filtersConfig || filtersConfig.search_input) && (
                    <div className="relative w-full max-w-[280px]">
                        <DelayedInput 
                            value={searchQuery}
                            onChange={onSearchChange}
                            placeholder={t('datatable.search')}
                            icon="search"
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm"
                        />
                    </div>
                )}

                {(!filtersConfig || filtersConfig.columns) && (
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
                )}
                
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
                        <div className="flex flex-wrap gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            {filtersConfig?.more_filters ? (
                                filtersConfig.more_filters.map(filter => renderFilterInput(filter))
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('products.status')}:</span>
                                        <select 
                                            value={filters.status || 'all'}
                                            onChange={(e) => onFilterChange({ status: e.target.value })}
                                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/20"
                                        >
                                            <option value="all">{t('datatable.allStatuses')}</option>
                                            {/* statusOptions were passed before, now we might need them from somewhere else or just use what's in filtersConfig */}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="flex items-end ml-auto">
                                {showReset && (
                                    <button 
                                        onClick={onReset}
                                        className="text-[10px] font-bold text-accent hover:opacity-80 uppercase tracking-widest transition-opacity py-2"
                                    >
                                        {t('common.reset')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
