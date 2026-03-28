
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCRMStore, Product } from '../../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';
import { TableSkeleton } from '../Skeleton';
import { ConfirmationModal } from '../ConfirmationModal';
import { TableHeader } from './TableHeader';
import { TableFilters } from './TableFilters';
import { TablePagination } from './TablePagination';
import { useTranslation } from 'react-i18next';

import { usePermissions } from '../../hooks/usePermissions';
import { DataTableRow } from './DataTableRow';

interface DataTableProps {
    entity?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ entity = 'products' }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { hasPermission } = usePermissions();
    const canWrite = hasPermission(entity, 'write');
    const { 
        items, 
        isLoading,
        schema,
        routes,
        fetchData,
        currentPage, 
        itemsPerPage, 
        totalItems,
        totalPages,
        searchQuery, 
        filters,
        sortBy,
        sortOrder,
        setCurrentPage, 
        setItemsPerPage, 
        setSearchQuery,
        setFilters,
        resetFilters,
        setSort,
        addItem,
        updateItem,
        deleteItem,
        bulkDeleteItems,
        selectedIds,
        setSelectedIds
    } = useCRMStore();

    const [localChanges, setLocalChanges] = useState<Record<string, any>>({});
    const [newRows, setNewRows] = useState<any[]>([]);

    const listRoute = routes?.find(r => r.path.substring(1) === entity);
    const basePath = listRoute?.path || `/${entity}`;

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; isBulk: boolean }>({
        isOpen: false,
        id: null,
        isBulk: false
    });

    const tableKey = Object.keys(schema?.table || {}).find(key => key.includes(entity)) || "auroparts-product";
    const tableConfig = schema?.table[tableKey]?.table;
    const filtersConfig = schema?.table[tableKey]?.filters;
    const initialCols = tableConfig?.cols || [];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(initialCols.map((c: any) => c.name));

    // Sync URL params to store on mount and when URL changes
    useEffect(() => {
        const params = Object.fromEntries(searchParams.entries());
        const { search, page, limit, sortBy: urlSortBy, sortOrder: urlSortOrder, ...restFilters } = params;

        if (search !== undefined && search !== searchQuery) setSearchQuery(search);
        if (page !== undefined && parseInt(page) !== currentPage) setCurrentPage(parseInt(page));
        if (limit !== undefined && parseInt(limit) !== itemsPerPage) setItemsPerPage(parseInt(limit));
        if (urlSortBy !== undefined && urlSortBy !== sortBy) setSort(urlSortBy, urlSortOrder as any);
        
        // Only update filters if they are different
        const currentFiltersStr = JSON.stringify(filters);
        const newFiltersStr = JSON.stringify({ ...filters, ...restFilters });
        if (currentFiltersStr !== newFiltersStr) {
            setFilters(restFilters);
        }
    }, [searchParams]);

    // Sync store to URL params when store changes
    useEffect(() => {
        const newParams = new URLSearchParams();
        if (searchQuery) newParams.set('search', searchQuery);
        if (currentPage > 1) newParams.set('page', currentPage.toString());
        if (itemsPerPage !== 10) newParams.set('limit', itemsPerPage.toString());
        if (sortBy) {
            newParams.set('sortBy', sortBy);
            newParams.set('sortOrder', sortOrder);
        }
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all') {
                newParams.set(key, value);
            }
        });

        // Only update URL if it's different to avoid infinite loops
        if (newParams.toString() !== searchParams.toString()) {
            setSearchParams(newParams, { replace: true });
        }
    }, [searchQuery, currentPage, itemsPerPage, filters, sortBy, sortOrder]);

    useEffect(() => {
        fetchData(entity);
    }, [fetchData, entity, currentPage, itemsPerPage, searchQuery, filters, sortBy, sortOrder]);

    if (!schema || !tableConfig) {
        return <TableSkeleton />;
    }

    const updateMode = tableConfig.updateMode || 'auto';
    const cols = initialCols.filter((c: any) => visibleColumns.includes(c.name));

    const toggleColumn = (name: string) => {
        setVisibleColumns(prev => 
            prev.includes(name) 
                ? prev.filter(n => n !== name) 
                : [...prev, name]
        );
    };

    // Get filter options from schema
    const formKey = Object.keys(schema?.form || {}).find(key => key.includes(entity)) || "auroparts-product";
    const statusOptions = (schema.form[formKey][0].fields.find((f: any) => f.name === 'status') as any)?.options || [];

    const handleAddRow = () => {
        const newRow: any = {
            id: `NEW-${Date.now()}`,
            image: 'https://picsum.photos/seed/new/100/100',
            identifier: `AURO-${Math.floor(Math.random() * 10000)}`,
            parent_id: '-',
            title: '',
            product_type: 'simple',
            status: 'draft',
            created_at: new Date().toISOString().split('T')[0]
        };
        setNewRows(prev => [newRow, ...prev]);
        setLocalChanges(prev => ({
            ...prev,
            [newRow.id]: { ...newRow }
        }));
    };

    const handleLocalChange = (itemId: string, field: string, value: any, autoUpdate?: boolean) => {
        const isNew = itemId.startsWith('NEW-');
        
        // Update local state first
        setLocalChanges(prev => ({
            ...prev,
            [itemId]: {
                ...(prev[itemId] || {}),
                [field]: value
            }
        }));

        // If autoUpdate is true or global updateMode is auto, and it's not a new row, trigger the store update
        if ((autoUpdate || updateMode === 'auto') && !isNew) {
            updateItem(entity, itemId, { [field]: value });
            
            // If it was an auto-update, we can clear the local change for this specific field
            if (autoUpdate || updateMode === 'auto') {
                setLocalChanges(prev => {
                    const next = { ...prev };
                    if (next[itemId]) {
                        const { [field]: _, ...rest } = next[itemId];
                        if (Object.keys(rest).length === 0) {
                            delete next[itemId];
                        } else {
                            next[itemId] = rest;
                        }
                    }
                    return next;
                });
            }
        }
    };

    const handleManualUpdate = async (itemId: string) => {
        const changes = localChanges[itemId];
        if (changes) {
            if (itemId.startsWith('NEW-')) {
                const { id, ...itemData } = changes;
                await addItem(entity, itemData);
                setNewRows(prev => prev.filter(r => r.id !== itemId));
            } else {
                await updateItem(entity, itemId, changes);
            }
            
            setLocalChanges(prev => {
                const next = { ...prev };
                delete next[itemId];
                return next;
            });
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === items.length && items.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(p => p.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleDelete = (id: string) => {
        if (id.startsWith('NEW-')) {
            setNewRows(prev => prev.filter(r => r.id !== id));
            setLocalChanges(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            return;
        }
        setDeleteModal({ isOpen: true, id, isBulk: false });
    };

    const handleBulkDelete = () => {
        setDeleteModal({ isOpen: true, id: null, isBulk: true });
    };

    const confirmDelete = () => {
        if (deleteModal.isBulk) {
            bulkDeleteItems(entity, selectedIds);
        } else if (deleteModal.id) {
            deleteItem(entity, deleteModal.id);
        }
    };

    const allRows = [...newRows, ...items];

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] text-[#1A1A1A] font-sans">
            {/* Header Controls */}
            <div className="bg-white border-b border-slate-200 px-4 py-4 sm:px-8 sm:py-6 flex flex-col gap-6">
                <TableHeader 
                    title={schema.table[tableKey].label.plural}
                    description={t(`${entity}.manageDescription`)}
                    onAddRow={canWrite ? handleAddRow : undefined}
                    onAddProduct={canWrite ? () => navigate(`${basePath}/add`) : undefined}
                    addProductLabel={schema.table[tableKey].label.singular}
                />

                <TableFilters 
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filters={filters}
                    onFilterChange={setFilters}
                    filtersConfig={filtersConfig}
                    onReset={() => {
                        setSearchQuery('');
                        const initialFilters: Record<string, any> = {};
                        if (filtersConfig?.more_filters) {
                            filtersConfig.more_filters.forEach((f: any) => {
                                const key = f.label.toLowerCase().replace(/\s+/g, '_');
                                if (f.type === 'date-range') {
                                    initialFilters[`${key}_start`] = '';
                                    initialFilters[`${key}_end`] = '';
                                } else {
                                    initialFilters[key] = f.type === 'select' ? 'all' : '';
                                }
                            });
                        } else {
                            initialFilters.status = 'all';
                            initialFilters.parentId = 'all';
                        }
                        resetFilters(initialFilters);
                    }}
                    showReset={Object.values(filters).some(v => v !== 'all' && v !== '') || !!searchQuery}
                    columns={initialCols.map((c: any) => ({ name: c.name, visible: visibleColumns.includes(c.name) }))}
                    onToggleColumn={toggleColumn}
                />
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-accent px-8 py-4 flex items-center justify-between text-white shadow-lg z-20"
                    >
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                                    {selectedIds.length}
                                </div>
                                <span className="text-sm font-bold uppercase tracking-wider">{t('datatable.itemsSelected', { count: selectedIds.length })}</span>
                            </div>
                            
                            <div className="h-6 w-px bg-white/20" />
                            
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-xs font-bold transition-all border border-rose-400/30"
                                >
                                    <Icon name="trash-2" className="w-4 h-4" />
                                    {t('common.delete')}
                                </button>
                                
                                <button 
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-all border border-white/10"
                                >
                                    <Icon name="edit" className="w-4 h-4" />
                                    {t('common.edit')} {t(`${entity}.status`)}
                                </button>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setSelectedIds([])}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 text-xs font-bold transition-all"
                        >
                            <Icon name="x" className="w-4 h-4" />
                            {t('common.cancel')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table Container */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 relative">
                {/* Loading Overlay */}
                <AnimatePresence>
                    {isLoading && items.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center"
                        >
                            <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{t('common.loading')}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={cn(
                    "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300",
                    isLoading && items.length > 0 && "opacity-50 grayscale-[0.5]"
                )}>
                    <div className="overflow-x-auto">
                        {isLoading && items.length === 0 ? (
                            <TableSkeleton />
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                        <th className="pl-8 pr-4 py-4 w-10">
                                            <label className="relative flex items-center justify-center cursor-pointer group select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.length === items.length && items.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="peer sr-only"
                                                />
                                                <div className={cn(
                                                    "w-5 h-5 border-2 rounded-md transition-all duration-200 ease-in-out",
                                                    "border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600",
                                                    "peer-checked:border-accent",
                                                    "group-hover:border-accent/60"
                                                )}></div>
                                                <svg 
                                                    className={cn(
                                                        "absolute w-3.5 h-3.5 text-accent transition-all duration-200 ease-in-out transform",
                                                        "opacity-0 scale-50",
                                                        "peer-checked:opacity-100 peer-checked:scale-100"
                                                    )} 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </label>
                                        </th>
                                        {/* Expand Button Header (Mobile Only) */}
                                        {cols.some((c: any) => c.responsive === 'expandable') && (
                                            <th className="px-4 py-4 w-10 md:hidden"></th>
                                        )}
                                        {cols.map((col: any) => (
                                            <th 
                                                key={col.name} 
                                                className={cn(
                                                    "px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors group",
                                                    col.responsive === 'expandable' || col.responsive === 'hide' ? "hidden md:table-cell" : "table-cell"
                                                )}
                                                style={{ width: col.width }}
                                                onClick={() => setSort(col.name)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {col.name}
                                                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Icon 
                                                            name="chevron-up" 
                                                            className={cn(
                                                                "w-2.5 h-2.5 -mb-1",
                                                                sortBy === col.name && sortOrder === 'asc' ? "text-accent opacity-100" : "text-slate-300"
                                                            )} 
                                                        />
                                                        <Icon 
                                                            name="chevron-down" 
                                                            className={cn(
                                                                "w-2.5 h-2.5",
                                                                sortBy === col.name && sortOrder === 'desc' ? "text-accent opacity-100" : "text-slate-300"
                                                            )} 
                                                        />
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allRows.map((item) => (
                                        <DataTableRow 
                                            key={item.id}
                                            item={item}
                                            cols={cols}
                                            selectedIds={selectedIds}
                                            toggleSelect={toggleSelect}
                                            localChanges={localChanges}
                                            statusOptions={statusOptions}
                                            handleLocalChange={handleLocalChange}
                                            handleManualUpdate={handleManualUpdate}
                                            handleDelete={canWrite ? handleDelete : undefined}
                                            onEdit={canWrite ? (id) => navigate(`${basePath}/edit/${id}`) : undefined}
                                        />
                                    ))}
                                    {allRows.length === 0 && (
                                        <tr>
                                            <td colSpan={cols.length + 2} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <Icon name="info" className="w-6 h-6 text-slate-400" />
                                                    </div>
                                                    <p className="text-slate-500 font-medium">{t('datatable.noItemsFound')}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <TablePagination 
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                paginationList={tableConfig.paginationList}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                totalPages={totalPages}
            />

            <ConfirmationModal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                title={deleteModal.isBulk ? t('datatable.deleteSelected') : t('common.delete')}
                message={deleteModal.isBulk 
                    ? t('media.deleteConfirm')
                    : t(`${entity}.deleteConfirm`)
                }
                confirmText={t('common.delete')}
                type="danger"
            />
        </div>
    );
};
