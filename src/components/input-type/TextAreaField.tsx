
import React from 'react';
import { cn } from '../../utils/cn';

interface TextAreaFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  hasError?: boolean;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  value,
  onChange,
  placeholder,
  readOnly,
  hasError
}) => {
  return (
    <textarea 
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(
        "w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white placeholder:text-slate-400 text-slate-900 min-h-[120px] resize-y",
        hasError ? "border-rose-300 bg-rose-50/30" : "border-slate-200",
        readOnly && "bg-slate-100 cursor-not-allowed opacity-70"
      )}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};
