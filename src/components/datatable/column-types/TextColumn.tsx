
import React from 'react';

interface TextColumnProps {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    placeholder?: string;
}

export const TextColumn: React.FC<TextColumnProps> = ({ value, onChange, onBlur, placeholder }) => {
    return (
        <input 
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-accent text-sm min-w-[120px]"
            placeholder={placeholder}
        />
    );
};
