
import React from 'react';
import { Icon } from '../Icon';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

interface TablePaginationProps {
    itemsPerPage: number;
    onItemsPerPageChange: (num: number) => void;
    paginationList: number[];
    currentPage: number;
    onPageChange: (page: number) => void;
    totalProducts: number;
    totalPages: number;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
    itemsPerPage,
    onItemsPerPageChange,
    paginationList,
    currentPage,
    onPageChange,
    totalProducts,
    totalPages
}) => {
    const { t } = useTranslation();
    const start = ((currentPage - 1) * itemsPerPage) + 1;
    const end = Math.min(currentPage * itemsPerPage, totalProducts);

    return (
        <div className="bg-white border-t border-slate-200 px-4 py-4 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                    <span>{t('datatable.rowsPerPage')}</span>
                    <select 
                        className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    >
                        {paginationList && paginationList.map(num => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                </div>
                <span className="hidden sm:inline opacity-30">|</span>
                <span>
                    {t('datatable.showing', { 
                        start, 
                        end, 
                        total: totalProducts 
                    })}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-all text-slate-600"
                >
                    <Icon name="chevron-left" className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onPageChange(i + 1)}
                            className={cn(
                                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                currentPage === i + 1 
                                    ? "bg-accent text-white shadow-sm shadow-accent/20" 
                                    : "text-slate-500 hover:bg-slate-100"
                            )}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
                <button 
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-all text-slate-600"
                >
                    <Icon name="chevron-right" className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
