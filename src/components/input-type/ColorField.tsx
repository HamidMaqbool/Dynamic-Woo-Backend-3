
import React from 'react';
import { cn } from '../../utils/cn';

interface ColorFieldProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export const ColorField: React.FC<ColorFieldProps> = ({
  value,
  onChange,
  readOnly
}) => {
  return (
    <div className={cn("flex items-center gap-3", readOnly && "opacity-70 cursor-not-allowed")}>
      <input 
        type="color"
        className="w-12 h-12 rounded-lg border-none cursor-pointer p-0 bg-transparent"
        value={value || '#000000'}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="text-sm font-mono text-slate-500 uppercase">{value || '#000000'}</span>
    </div>
  );
};
