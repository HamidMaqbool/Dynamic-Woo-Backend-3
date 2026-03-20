
import React from 'react';
import { cn } from '../../utils/cn';

interface RadioFieldProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options?: { label: string; value: string }[];
  readOnly?: boolean;
}

export const RadioField: React.FC<RadioFieldProps> = ({
  name,
  value,
  onChange,
  options,
  readOnly
}) => {
  return (
    <div className="flex flex-wrap gap-6">
      {options?.map((opt) => (
        <label 
          key={opt.value} 
          className={cn(
            "flex items-center gap-3 cursor-pointer group select-none", 
            readOnly && "cursor-not-allowed opacity-70"
          )}
        >
          <div className="relative flex items-center justify-center">
            <input 
              type="radio"
              name={name}
              className="peer sr-only"
              checked={value === opt.value}
              disabled={readOnly}
              onChange={() => onChange(opt.value)}
            />
            <div className={cn(
              "w-5 h-5 border-2 rounded-full transition-all duration-200 ease-in-out",
              "border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600",
              "peer-checked:border-accent",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50 peer-focus-visible:ring-offset-2",
              "group-hover:border-accent/60"
            )}></div>
            <div className={cn(
              "absolute w-2.5 h-2.5 bg-accent rounded-full transition-all duration-200 ease-in-out transform",
              "scale-0 opacity-0",
              "peer-checked:scale-100 peer-checked:opacity-100"
            )}></div>
          </div>
          <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900 transition-colors">
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
};
