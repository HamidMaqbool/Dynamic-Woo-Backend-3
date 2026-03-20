
import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../Icon';
import { cn } from '../../utils/cn';
import { MediaModal } from '../media/MediaModal';

interface Option {
    name: string;
    values: string[];
}

interface Variant {
    id: string;
    combination: string[];
    price: string;
    sku: string;
    inventory: number;
    image?: string;
    isDefault?: boolean;
}

interface VariationFieldProps {
    value: { options: Option[], variants: Variant[] } | any;
    onChange: (val: any) => void;
    readOnly?: boolean;
    columns?: any[];
}

export const VariationField: React.FC<VariationFieldProps> = ({ value, onChange, readOnly, columns }) => {
    const initialOptions = value?.options || [];
    const initialVariants = value?.variants || [];

    const [options, setOptions] = useState<Option[]>(initialOptions);
    const [variants, setVariants] = useState<Variant[]>(initialVariants);
    const [hasOptions, setHasOptions] = useState(initialOptions.length > 0);
    const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
    const [bulkEditValue, setBulkEditValue] = useState<{ field: string; value: any } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeVariantIndex, setActiveVariantIndex] = useState<number | null>(null);

    // Default columns if none provided in schema
    const tableColumns = columns || [
        { name: "isDefault", label: "Default", type: "radio", width: "80px" },
        { name: "image", label: "Image", type: "image", width: "80px" },
        { name: "combination", label: "Variant", type: "text", readOnly: true },
        { name: "price", label: "Price", type: "number", prefix: "$" },
        { name: "sku", label: "SKU", type: "text" },
        { name: "inventory", label: "Inventory", type: "number" }
    ];

    // Update parent when local state changes
    useEffect(() => {
        if (hasOptions) {
            onChange({ options, variants });
        } else {
            onChange(null);
        }
    }, [options, variants, hasOptions]);

    const addOption = () => {
        if (options.length < 3) {
            setOptions([...options, { name: '', values: [] }]);
        }
    };

    const removeOption = (index: number) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
        generateVariants(newOptions);
    };

    const updateOptionName = (index: number, name: string) => {
        const newOptions = [...options];
        newOptions[index].name = name;
        setOptions(newOptions);
    };

    const addOptionValue = (index: number, val: string) => {
        if (!val.trim()) return;
        const newOptions = [...options];
        if (!newOptions[index].values.includes(val.trim())) {
            newOptions[index].values.push(val.trim());
            setOptions(newOptions);
            generateVariants(newOptions);
        }
    };

    const removeOptionValue = (optIndex: number, valIndex: number) => {
        const newOptions = [...options];
        newOptions[optIndex].values = newOptions[optIndex].values.filter((_, i) => i !== valIndex);
        setOptions(newOptions);
        generateVariants(newOptions);
    };

    const generateVariants = (currentOptions: Option[]) => {
        const validOptions = currentOptions.filter(o => o.name && o.values.length > 0);
        if (validOptions.length === 0) {
            setVariants([]);
            return;
        }

        const combinations: string[][] = [[]];
        validOptions.forEach(opt => {
            const newCombinations: string[][] = [];
            combinations.forEach(combo => {
                opt.values.forEach(val => {
                    newCombinations.push([...combo, val]);
                });
            });
            combinations.length = 0;
            combinations.push(...newCombinations);
        });

        const newVariants = combinations.map((combo, idx) => {
            const comboStr = combo.join(' / ');
            const existing = variants.find(v => v.combination.join(' / ') === comboStr);
            return existing || {
                id: `VAR-${Math.random().toString(36).substr(2, 9)}`,
                combination: combo,
                price: '0.00',
                sku: '',
                inventory: 0,
                image: '',
                isDefault: idx === 0 && variants.length === 0 // Default first one if none exist
            };
        });

        setVariants(newVariants);
    };

    const updateVariant = (index: number, field: keyof Variant, val: any) => {
        const newVariants = [...variants];
        if (field === 'isDefault' && val === true) {
            // Unset other defaults
            newVariants.forEach((v, i) => {
                v.isDefault = i === index;
            });
        } else {
            newVariants[index] = { ...newVariants[index], [field]: val };
        }
        setVariants(newVariants);
    };

    const handleBulkEdit = () => {
        if (!bulkEditValue || selectedVariants.length === 0) return;
        const newVariants = variants.map(v => {
            if (selectedVariants.includes(v.id)) {
                return { ...v, [bulkEditValue.field]: bulkEditValue.value };
            }
            return v;
        });
        setVariants(newVariants);
        setBulkEditValue(null);
        setSelectedVariants([]);
    };

    const handleImageUpload = (index: number) => {
        setActiveVariantIndex(index);
        setIsModalOpen(true);
    };

    const handleSelectMedia = (items: any[]) => {
        if (items.length > 0 && activeVariantIndex !== null) {
            updateVariant(activeVariantIndex, 'image', items[0].url);
        }
    };

    const toggleSelectAll = () => {
        if (selectedVariants.length === variants.length) {
            setSelectedVariants([]);
        } else {
            setSelectedVariants(variants.map(v => v.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedVariants.includes(id)) {
            setSelectedVariants(selectedVariants.filter(i => i !== id));
        } else {
            setSelectedVariants([...selectedVariants, id]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <input 
                    type="checkbox" 
                    id="has-options"
                    checked={hasOptions}
                    onChange={(e) => setHasOptions(e.target.checked)}
                    className="w-4 h-4 text-accent rounded focus:ring-accent"
                    disabled={readOnly}
                />
                <label htmlFor="has-options" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    This product has options, like size or color
                </label>
            </div>

            {hasOptions && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                    {/* Options Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Options</h3>
                        <div className="space-y-4">
                            {options.map((opt, idx) => (
                                <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 relative group">
                                    {!readOnly && (
                                        <button 
                                            onClick={() => removeOption(idx)}
                                            className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <Icon name="trash" className="w-4 h-4" />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Option Name</label>
                                            <input 
                                                type="text"
                                                value={opt.name}
                                                onChange={(e) => updateOptionName(idx, e.target.value)}
                                                placeholder="e.g. Size"
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Option Values</label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {opt.values.map((val, vIdx) => (
                                                    <span key={vIdx} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs font-bold rounded-md border border-accent/20">
                                                        {val}
                                                        {!readOnly && (
                                                            <button onClick={() => removeOptionValue(idx, vIdx)} className="hover:text-accent">
                                                                <Icon name="x" className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                            {!readOnly && (
                                                <input 
                                                    type="text"
                                                    placeholder="Add value and press Enter"
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            addOptionValue(idx, e.currentTarget.value);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {!readOnly && options.length < 3 && (
                            <button 
                                onClick={addOption}
                                className="flex items-center gap-2 text-accent text-sm font-bold hover:opacity-80 transition-colors"
                            >
                                <Icon name="plus" className="w-4 h-4" />
                                Add another option
                            </button>
                        )}
                    </div>

                    {/* Variants Table */}
                    {variants.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Preview</h3>
                                
                                {/* Bulk Edit Controls */}
                                {selectedVariants.length > 0 && (
                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                                        <span className="text-xs font-bold text-slate-500">{selectedVariants.length} selected</span>
                                        <select 
                                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-accent/20 outline-none"
                                            onChange={(e) => setBulkEditValue({ field: e.target.value, value: '' })}
                                        >
                                            <option value="">Bulk Edit...</option>
                                            {tableColumns.filter(c => !c.readOnly && c.type !== 'radio' && c.type !== 'image').map(c => (
                                                <option key={c.name} value={c.name}>{c.label}</option>
                                            ))}
                                        </select>
                                        {bulkEditValue && (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type={tableColumns.find(c => c.name === bulkEditValue.field)?.type === 'number' ? 'number' : 'text'}
                                                    placeholder={`New ${bulkEditValue.field}`}
                                                    className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-accent/20"
                                                    onChange={(e) => setBulkEditValue({ ...bulkEditValue, value: e.target.value })}
                                                />
                                                <button 
                                                    onClick={handleBulkEdit}
                                                    className="px-3 py-1.5 bg-accent text-white text-xs font-bold rounded-lg hover:opacity-90 transition-colors"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 w-10">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedVariants.length === variants.length}
                                                    onChange={toggleSelectAll}
                                                    className="w-4 h-4 text-accent rounded focus:ring-accent"
                                                />
                                            </th>
                                            {tableColumns.map(col => (
                                                <th key={col.name} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase" style={{ width: col.width }}>
                                                    {col.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {variants.map((v, idx) => (
                                            <tr key={idx} className={cn("hover:bg-slate-50/50 transition-colors", v.isDefault && "bg-accent/5", selectedVariants.includes(v.id) && "bg-accent/10")}>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedVariants.includes(v.id)}
                                                        onChange={() => toggleSelect(v.id)}
                                                        className="w-4 h-4 text-accent rounded focus:ring-accent"
                                                    />
                                                </td>
                                                {tableColumns.map(col => (
                                                    <td key={col.name} className="px-4 py-3">
                                                        {renderVariantCell(col, v, idx, updateVariant, handleImageUpload, readOnly)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <MediaModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleSelectMedia}
                multiSelect={false}
            />
        </div>
    );
};

function renderVariantCell(col: any, variant: Variant, index: number, updateVariant: any, handleImageUpload: any, readOnly?: boolean) {
    const value = variant[col.name as keyof Variant];

    switch (col.type) {
        case 'radio':
            return (
                <div className="flex justify-center">
                    <input 
                        type="radio"
                        name="default-variant"
                        checked={!!value}
                        onChange={() => updateVariant(index, col.name, true)}
                        className="w-4 h-4 text-accent focus:ring-accent/50"
                        disabled={readOnly}
                    />
                </div>
            );
        case 'image':
            return (
                <div 
                    onClick={() => !readOnly && handleImageUpload(index)}
                    className={cn(
                        "w-10 h-10 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent transition-colors",
                        value && "border-none"
                    )}
                >
                    {value ? (
                        <img src={value as string} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <Icon name="image" className="w-4 h-4 text-slate-400" />
                    )}
                </div>
            );
        case 'number':
            return (
                <div className="relative">
                    {col.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{col.prefix}</span>}
                    <input 
                        type="number"
                        value={value as any}
                        onChange={(e) => updateVariant(index, col.name, col.name === 'inventory' ? parseInt(e.target.value) || 0 : e.target.value)}
                        className={cn(
                            "w-24 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none",
                            col.prefix ? "pl-6" : "pl-3"
                        )}
                        disabled={readOnly || col.readOnly}
                    />
                </div>
            );
        case 'text':
        default:
            if (col.name === 'combination') {
                return <span className="text-sm font-bold text-slate-700">{(value as string[]).join(' / ')}</span>;
            }
            return (
                <input 
                    type="text"
                    value={value as string}
                    onChange={(e) => updateVariant(index, col.name, e.target.value)}
                    className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                    placeholder={col.label}
                    disabled={readOnly || col.readOnly}
                />
            );
    }
}
