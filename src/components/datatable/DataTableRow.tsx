
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';
import { Product } from '../../store/useStore';
import { DataTableCell } from './DataTableCell';
import { Icon } from '../Icon';

interface DataTableRowProps {
    item: any;
    cols: any[];
    selectedIds: string[];
    toggleSelect: (id: string) => void;
    localChanges: Record<string, any>;
    statusOptions: { value: string; label: string }[];
    handleLocalChange: (itemId: string, field: string, value: any, autoUpdate?: boolean) => void;
    handleManualUpdate: (itemId: string) => void;
    handleDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
}

export const DataTableRow: React.FC<DataTableRowProps> = ({
    item,
    cols,
    selectedIds,
    toggleSelect,
    localChanges,
    statusOptions,
    handleLocalChange,
    handleManualUpdate,
    handleDelete,
    onEdit
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isSelected = selectedIds.includes(item.id);

   
    


    const expandableCols = cols.filter(col => col.responsive === 'expandable');
    const hasExpandable = expandableCols.length > 0;

    return (
        <>
            <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "hover:bg-slate-50/80 transition-colors group relative",
                    isSelected && "bg-accent/5",
                    isExpanded && "bg-slate-50/80"
                )}
            >
                <td className="pl-8 pr-4 py-4 relative">
                    {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                    )}
                    <label className="relative flex items-center justify-center cursor-pointer group select-none">
                        <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="peer sr-only"
                          
                        />
                        <div className={cn(
                            "w-5 h-5 border-2 rounded-md transition-all duration-200 ease-in-out",
                            "border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600",
                            "peer-checked:border-accent",
                            "group-hover:border-accent/60",
                            
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
                </td>

                {/* Expand Button Cell (Mobile Only) */}
                {hasExpandable && (
                    <td className="px-4 py-4 md:hidden">
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                "hover:bg-slate-200 text-slate-400 hover:text-slate-600",
                                isExpanded && "bg-slate-200 text-slate-600 rotate-180"
                            )}
                        >
                            <Icon name="chevron-down" className="w-4 h-4" />
                        </button>
                    </td>
                )}

                {cols.map((col: any) => (
                    <td 
                        key={col.name} 
                        className={cn(
                            "px-6 py-4 text-sm text-slate-600 relative",
                            col.responsive === 'expandable' || col.responsive === 'hide' ? "hidden md:table-cell" : "table-cell"
                        )}
                        style={{ width: col.width }}
                    >
                        {isSelected && col.name === cols[cols.length - 1].name && (
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-accent" />
                        )}
                        <DataTableCell 
                            col={col}
                            item={item}
                            localValue={localChanges[item.id]?.[col.name as string]}
                            statusOptions={statusOptions}
                            onLocalChange={handleLocalChange}
                            onManualUpdate={handleManualUpdate}
                            onDelete={handleDelete}
                            onEdit={onEdit}
                            hasChanges={!!localChanges[item.id]}
                        />
                    </td>
                ))}
            </motion.tr>

            {/* Expanded Content (Mobile Only) */}
            <AnimatePresence>
                {isExpanded && hasExpandable && (
                    <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-slate-50/50"
                    >
                        <td colSpan={1 + (hasExpandable ? 1 : 0) + cols.filter(c => c.responsive === 'show').length} className="px-8 py-4 border-b border-slate-100">
                            <div className="grid grid-cols-1 gap-4">
                                {expandableCols.map((col: any) => (
                                    <div key={col.name} className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {col.name}
                                        </span>
                                        <div className="text-sm text-slate-600">
                                            <DataTableCell 
                                                col={col}
                                                item={item}
                                                localValue={localChanges[item.id]?.[col.col as string]}
                                                statusOptions={statusOptions}
                                                onLocalChange={handleLocalChange}
                                                onManualUpdate={handleManualUpdate}
                                                onDelete={handleDelete}
                                                onEdit={onEdit}
                                                hasChanges={!!localChanges[item.id]}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </td>
                    </motion.tr>
                )}
            </AnimatePresence>
        </>
    );
};
