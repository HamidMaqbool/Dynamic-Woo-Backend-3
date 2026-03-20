
import React from 'react';
import { cn } from '../../utils/cn';

interface TextFieldProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  hasError?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  readOnly,
  hasError
}) => {
  return (
    <input 
      type={type}
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(
        "w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white placeholder:text-slate-400 text-slate-900",
        hasError ? "border-rose-300 bg-rose-50/30" : "border-slate-200",
        readOnly && "bg-slate-100 cursor-not-allowed opacity-70"
      )}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};
