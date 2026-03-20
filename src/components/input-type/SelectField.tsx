
import React from 'react';
import { cn } from '../../utils/cn';

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options?: { label: string; value: string }[];
  hasError?: boolean;
  readOnly?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  value,
  onChange,
  options,
  hasError,
  readOnly
}) => {
  return (
    <div className="relative">
      <select 
        disabled={readOnly}
        className={cn(
          "w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white placeholder:text-slate-400 text-slate-900 appearance-none pr-10 cursor-pointer",
          hasError ? "border-rose-300 bg-rose-50/30" : "border-slate-200",
          readOnly && "bg-slate-100 cursor-not-allowed opacity-70"
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};
