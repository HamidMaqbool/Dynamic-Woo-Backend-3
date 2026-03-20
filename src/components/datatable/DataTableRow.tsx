
import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../utils/cn';
import { Product } from '../../store/useStore';
import { DataTableCell } from './DataTableCell';

interface DataTableRowProps {
    product: Product;
    cols: any[];
    selectedProductIds: string[];
    toggleSelect: (id: string) => void;
    localChanges: Record<string, Partial<Product>>;
    statusOptions: { value: string; label: string }[];
    handleLocalChange: (productId: string, field: string, value: any, autoUpdate?: boolean) => void;
    handleManualUpdate: (productId: string) => void;
    handleDelete: (id: string) => void;
    onEdit: (id: string) => void;
}

export const DataTableRow: React.FC<DataTableRowProps> = ({
    product,
    cols,
    selectedProductIds,
    toggleSelect,
    localChanges,
    statusOptions,
    handleLocalChange,
    handleManualUpdate,
    handleDelete,
    onEdit
}) => {
    const isSelected = selectedProductIds.includes(product.id);
    const isNew = product.id.startsWith('NEW-');

    return (
        <motion.tr 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "hover:bg-slate-50/80 transition-colors group relative",
                isSelected && "bg-accent/5",
                isNew && "bg-accent/5"
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
                        onChange={() => toggleSelect(product.id)}
                        className="peer sr-only"
                        disabled={isNew}
                    />
                    <div className={cn(
                        "w-5 h-5 border-2 rounded-md transition-all duration-200 ease-in-out",
                        "border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600",
                        "peer-checked:border-accent",
                        "group-hover:border-accent/60",
                        isNew && "opacity-30 cursor-not-allowed"
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
            {cols.map((col: any) => (
                <td 
                    key={col.name} 
                    className="px-6 py-4 text-sm text-slate-600 relative"
                    style={{ width: col.width }}
                >
                    {isSelected && col.name === cols[cols.length - 1].name && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-accent" />
                    )}
                    <DataTableCell 
                        col={col}
                        product={product}
                        localValue={localChanges[product.id]?.[col.col as string]}
                        statusOptions={statusOptions}
                        onLocalChange={handleLocalChange}
                        onManualUpdate={handleManualUpdate}
                        onDelete={handleDelete}
                        onEdit={onEdit}
                        hasChanges={!!localChanges[product.id]}
                    />
                </td>
            ))}
        </motion.tr>
    );
};
