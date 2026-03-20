
import React from 'react';
import { cn } from '../../utils/cn';

interface StatusColumnProps {
    status: string;
}

export const StatusColumn: React.FC<StatusColumnProps> = ({ status }) => {
    const isPublished = status === 'publish';
    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            isPublished 
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                : "bg-amber-50 text-amber-600 border border-amber-100"
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", isPublished ? "bg-emerald-500" : "bg-amber-500")}></span>
            {status}
        </span>
    );
};
