
import React from 'react';

interface SelectColumnProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}

export const SelectColumn: React.FC<SelectColumnProps> = ({ value, onChange, options }) => {
    return (
        <select 
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-accent text-sm min-w-[120px] appearance-none cursor-pointer"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
};
