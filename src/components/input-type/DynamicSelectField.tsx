
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';

interface Option {
  value: string;
  label: string;
}

interface DynamicSelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options?: Option[];
  dataSource?: string;
  hasError?: boolean;
  readOnly?: boolean;
}

export const DynamicSelectField: React.FC<DynamicSelectFieldProps> = ({
  value,
  onChange,
  options: staticOptions = [],
  dataSource,
  hasError,
  readOnly
}) => {
  const [options, setOptions] = useState<Option[]>(staticOptions);
  const [isLoading, setIsLoading] = useState(!!dataSource);

  useEffect(() => {
    if (dataSource) {
      const fetchOptions = async () => {
        try {
          const data = await apiFetch(dataSource);
          if (Array.isArray(data)) {
            setOptions([...staticOptions, ...data]);
          }
        } catch (err) {
          console.error('Error fetching dynamic options:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchOptions();
    }
  }, [dataSource]);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly || isLoading}
        className={cn(
          "w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all appearance-none cursor-pointer",
          "focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none",
          hasError ? "border-rose-500 text-rose-900" : "border-slate-200 text-slate-700 hover:border-slate-300",
          (readOnly || isLoading) && "bg-slate-50 cursor-not-allowed opacity-70"
        )}
      >
        <option value="">{isLoading ? 'Loading...' : 'Select an option'}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-slate-300 border-t-accent rounded-full animate-spin" />
        ) : (
          <Icon name="chevron-down" className="w-4 h-4" />
        )}
      </div>
    </div>
  );
};
