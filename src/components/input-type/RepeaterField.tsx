
import React, { useState, useRef } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';

interface RepeaterFieldProps {
  value: any[];
  onChange: (value: any[]) => void;
  fields: any[];
  renderField: (field: any, value: any, onChange: (val: any) => void) => React.ReactNode;
  readOnly?: boolean;
}

export const RepeaterField: React.FC<RepeaterFieldProps> = ({
  value = [],
  onChange,
  fields,
  renderField,
  readOnly
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragTimeoutRef = useRef<any>(null);
  const lastReorderTimeRef = useRef<number>(0);

  const itemsWithIds = React.useMemo(() => {
    return value.map(item => {
      if (!item._id) {
        return { ...item, _id: Math.random().toString(36).substr(2, 9) };
      }
      return item;
    });
  }, [value]);

  const addItem = () => {
    const newItem: any = { _id: Math.random().toString(36).substr(2, 9) };
    fields.forEach(f => {
      newItem[f.name] = f.value ?? '';
    });
    onChange([...value, newItem]);
  };

  const removeItem = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const updateItem = (index: number, fieldName: string, fieldValue: any) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], [fieldName]: fieldValue };
    onChange(newValue);
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    e.preventDefault();
    
    // Prevent rapid back-and-forth reordering
    const now = Date.now();
    if (now - lastReorderTimeRef.current < 200) return;

    if (draggedIndex === null || draggedIndex === index) {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = null;
      }
      setDragOverIndex(null);
      return;
    }
    
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      
      dragTimeoutRef.current = setTimeout(() => {
        const newValue = [...value];
        const item = newValue.splice(draggedIndex, 1)[0];
        newValue.splice(index, 0, item);
        
        lastReorderTimeRef.current = Date.now();
        onChange(newValue);
        setDraggedIndex(index);
      }, 150);
    }
  };

  const onDrop = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    e.preventDefault();
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {itemsWithIds.map((item, index) => {
          const isDragging = draggedIndex === index;
          const itemKey = item._id;

          return (
            <motion.div 
              key={itemKey} 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                layout: { type: "spring", stiffness: 500, damping: 50, mass: 1 },
                opacity: { duration: 0.2 }
              }}
              onDragOver={(e) => onDragOver(e, index)}
              onDrop={(e) => onDrop(e, index)}
              className={cn(
                "group relative bg-slate-50 border rounded-xl p-4 sm:p-5",
                isDragging ? "opacity-0" : "opacity-100 border-slate-200",
                !readOnly && "hover:border-accent/30 hover:shadow-sm"
              )}
            >
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      draggable={!readOnly}
                      onDragStart={(e) => onDragStart(e, index)}
                      onDragEnd={onDragEnd}
                      className={cn(
                        "p-1 text-slate-300 transition-colors",
                        !readOnly && "group-hover:text-accent cursor-grab active:cursor-grabbing"
                      )}
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Item #{index + 1}
                    </span>
                  </div>
                  {!readOnly && (
                    <button 
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fields.map((field, fIdx) => (
                    <div 
                      key={fIdx} 
                      className={field.class === 'full' ? 'sm:col-span-2' : 'sm:col-span-1'}
                    >
                      {field.title && (
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                          {field.title}
                        </label>
                      )}
                      {renderField(
                        field, 
                        item[field.name], 
                        (val) => updateItem(index, field.name, val)
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
      </div>

      {!readOnly && (
        <button 
          type="button"
          onClick={addItem}
          className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Add New Item</span>
        </button>
      )}

      {value.length === 0 && !readOnly && (
        <div className="py-10 text-center bg-slate-50/50 rounded-2xl border border-slate-100">
          <p className="text-sm text-slate-400 font-medium italic">No items added yet</p>
        </div>
      )}
    </div>
  );
};
