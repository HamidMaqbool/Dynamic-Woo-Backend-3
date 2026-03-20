
import React from 'react';
import { cn } from '../../../utils/cn';

interface BadgeColumnProps {
    value: string;
    type?: 'accent' | 'slate';
}

export const BadgeColumn: React.FC<BadgeColumnProps> = ({ value, type = 'slate' }) => {
    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            type === 'accent' 
                ? "bg-accent/10 text-accent border-accent/20" 
                : "bg-slate-50 text-slate-600 border-slate-100"
        )}>
            {value}
        </span>
    );
};
