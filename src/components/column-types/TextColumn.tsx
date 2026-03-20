
import React from 'react';

interface TextColumnProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const TextColumn: React.FC<TextColumnProps> = ({ value, onChange, placeholder }) => {
    return (
        <input 
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-accent text-sm"
            placeholder={placeholder}
        />
    );
};
