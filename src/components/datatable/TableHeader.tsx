
import React from 'react';
import { Icon } from '../Icon';
import { useTranslation } from 'react-i18next';

interface TableHeaderProps {
    title: string;
    description: string;
    onAddRow: () => void;
    onAddProduct: () => void;
    addProductLabel: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ 
    title, 
    description, 
    onAddRow, 
    onAddProduct, 
    addProductLabel 
}) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {title}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                    {description}
                </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                    onClick={onAddRow}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-all active:scale-[0.98] text-sm font-semibold w-full sm:w-auto"
                >
                    <Icon name="plus" className="w-4 h-4" />
                    <span>{t('datatable.addRow')}</span>
                </button>
                <button 
                    onClick={onAddProduct}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 shadow-sm shadow-accent/20 transition-all active:scale-[0.98] text-sm font-semibold w-full sm:w-auto"
                >
                    <Icon name="file-plus" className="w-4 h-4" />
                    <span>{t('common.add')} {addProductLabel}</span>
                </button>
            </div>
        </div>
    );
};
