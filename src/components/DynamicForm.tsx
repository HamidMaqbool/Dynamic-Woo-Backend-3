
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMStore, Product } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';
import { FormSkeleton } from './Skeleton';
import { rules, validate as runValidation, ValidationRule } from '../utils/validation';
import { apiFetch } from '../services/api';
import { useTranslation } from 'react-i18next';

// Import individual input components
import { TextField } from './input-type/TextField';
import { TextAreaField } from './input-type/TextAreaField';
import { DynamicSelectField } from './input-type/DynamicSelectField';
import { CheckboxField } from './input-type/CheckboxField';
import { RadioField } from './input-type/RadioField';
import { ImageField } from './input-type/ImageField';
import { GalleryField } from './input-type/GalleryField';
import { ColorField } from './input-type/ColorField';
import { RepeaterField } from './input-type/RepeaterField';
import { VariationField } from './input-type/VariationField';
import { PermissionsGrid } from './input-type/PermissionsGrid';

interface DynamicFormProps {
    entity: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ entity }) => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addItem, updateItem, addNotification, schema, routes, fetchItemById } = useCRMStore();
    
    const listRoute = routes?.find(r => r.view === 'list');
    const basePath = listRoute?.path || `/${entity}`;
    
    const [formData, setFormData] = useState<any>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const formKey = schema?.form[entity] ? entity : Object.keys(schema?.form || {})[0];
    const formConfig = schema?.form[formKey] || [];

    useEffect(() => {
        const loadData = async () => {
            if (!schema) {
                console.log("DynamicForm: Schema not ready yet");
                return;
            }
            setIsLoading(true);
            console.log(`DynamicForm: Loading data for ${entity} ID:`, id);
            
            if (id) {
                // Fetch from server
                try {
                    const item = await fetchItemById(entity, id);
                    console.log("DynamicForm: Fetched item:", item);
                    if (item) {
                        setFormData(item);
                    } else {
                        console.warn("DynamicForm: Item not found, redirecting...");
                        navigate(basePath);
                    }
                } catch (err) {
                    console.error("DynamicForm: Error fetching item:", err);
                    navigate(basePath);
                }
            } else {
                const defaults: any = {};
                formConfig.forEach((section: any) => {
                    section.fields.forEach((field: any) => {
                        if (field.value !== undefined) defaults[field.name] = field.value;
                        if (field.type === 'repeater' && !defaults[field.name]) {
                            defaults[field.name] = [];
                        }
                    });
                });
                setFormData(defaults);
            }
            setIsLoading(false);
        };
        loadData();
    }, [id, schema, fetchItemById, navigate, entity, formConfig, basePath]);

    if (!schema) {
        return <FormSkeleton />;
    }

    const validate = () => {
        const validationSchema: Record<string, ValidationRule[]> = {};
        
        formConfig.forEach((section: any) => {
            section.fields.forEach((field: any) => {
                const fieldRules: ValidationRule[] = [];
                if (field.valid === 'required') {
                    fieldRules.push(rules.required);
                }
                if (field.type === 'email') {
                    fieldRules.push(rules.email);
                }
                if (field.type === 'url') {
                    fieldRules.push(rules.url);
                }
                if (field.type === 'number') {
                    fieldRules.push(rules.numeric);
                }
                
                if (fieldRules.length > 0) {
                    validationSchema[field.name] = fieldRules;
                }
            });
        });
        
        const newErrors = runValidation(formData, validationSchema);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            addNotification(t('form.fixErrors'), 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            if (id) {
                await updateItem(entity, id, formData);
            } else {
                // For new items, we might need some defaults if not provided
                const newItem = { ...formData };
                
                // Add entity-specific defaults if needed
                if (entity === 'auroparts-product') {
                    Object.assign(newItem, {
                        status: formData.status || 'publish',
                        product_type: formData.product_type || 'simple',
                        image: formData.image || 'https://picsum.photos/seed/new/100/100',
                        identifier: formData.identifier || `AURO-${Math.floor(Math.random() * 10000)}`,
                        parent_id: formData.parent_id || '-',
                        title: formData.item_name || 'Untitled Product'
                    });
                }

                await addItem(entity, newItem);
            }
            navigate(basePath);
        } catch (error) {
            // Error is handled in store
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderFieldInternal = useCallback((field: any, value: any, onChange: (val: any) => void) => {
        const hasError = !!errors[field.name];
        const readOnly = field.attr?.readOnly === 'true' || field.readOnly === true;

        switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
            case 'number':
            case 'tel':
            case 'url':
            case 'date':
            case 'time':
                return (
                    <TextField 
                        type={field.type}
                        value={value ?? ''}
                        onChange={onChange}
                        placeholder={field.placeholder}
                        readOnly={readOnly}
                        hasError={hasError}
                    />
                );
            case 'textarea':
                return (
                    <TextAreaField 
                        value={value ?? ''}
                        onChange={onChange}
                        placeholder={field.placeholder}
                        readOnly={readOnly}
                        hasError={hasError}
                    />
                );
            case 'select':
            case 'status':
            case 'dynamic-select':
                return (
                    <DynamicSelectField 
                        value={value ?? ''}
                        onChange={onChange}
                        options={field.options}
                        dataSource={field.dataSource}
                        hasError={hasError}
                        readOnly={readOnly}
                    />
                );
            case 'checkbox':
                return (
                    <CheckboxField 
                        value={!!value}
                        onChange={onChange}
                        placeholder={field.placeholder}
                        title={field.title}
                        readOnly={readOnly}
                    />
                );
            case 'radio':
                return (
                    <RadioField 
                        name={field.name}
                        value={value ?? ''}
                        onChange={onChange}
                        options={field.options}
                        readOnly={readOnly}
                    />
                );
            case 'image':
                return (
                    <ImageField 
                        value={value ?? ''}
                        onChange={onChange}
                        readOnly={readOnly}
                    />
                );
            case 'images':
            case 'gallery':
                return (
                    <GalleryField 
                        value={Array.isArray(value) ? value : []} 
                        onChange={onChange}
                        max={field.max || 10}
                        readOnly={readOnly}
                    />
                );
            case 'color':
                return (
                    <ColorField 
                        value={value ?? ''}
                        onChange={onChange}
                        readOnly={readOnly}
                    />
                );
            case 'repeater':
                return (
                    <RepeaterField 
                        value={Array.isArray(value) ? value : []}
                        onChange={onChange}
                        fields={field.fields || []}
                        renderField={renderFieldInternal}
                        readOnly={readOnly}
                    />
                );
            case 'variation':
                return (
                    <VariationField 
                        value={value}
                        onChange={onChange}
                        readOnly={readOnly}
                        columns={field.columns}
                    />
                );
            case 'permissions-grid':
                return (
                    <PermissionsGrid 
                        value={value || {}}
                        onChange={onChange}
                        readOnly={readOnly}
                    />
                );
            default:
                return <div className="text-xs text-rose-500 font-bold bg-rose-50 p-3 rounded-lg border border-rose-100 italic">Unsupported field type: {field.type}</div>;
        }
    }, [errors]);

    const mainSections = formConfig.filter(s => s.type !== 'sidebar');
    const sidebarSections = formConfig.filter(s => s.type === 'sidebar');

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] text-[#1A1A1A] font-sans relative">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(basePath)}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
                    >
                        <Icon name="arrow-left" className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                            {id ? t('common.edit') : t('common.create')} {schema.table[entity]?.label?.singular || entity}
                        </h1>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                            {id ? `${t('common.id')}: ${id}` : t('form.newEntry')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => navigate(basePath)}
                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-accent text-white rounded-lg hover:opacity-90 shadow-sm shadow-accent/20 transition-all active:scale-[0.98] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Icon name="save" className="w-4 h-4" />
                        )}
                        {isSubmitting ? t('common.submitting') : t('common.saveChanges')}
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-auto relative">
                {/* Loading Overlay */}
                <AnimatePresence>
                    {(isLoading || isSubmitting) && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 bg-white/40 backdrop-blur-[2px] flex items-center justify-center"
                        >
                            <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                    {isSubmitting ? t('form.savingChanges') : t('form.loadingData')}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isLoading && !formData.id ? (
                    <FormSkeleton />
                ) : (
                    <div className={cn(
                        "max-w-7xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 transition-all duration-300",
                        (isLoading || isSubmitting) && "opacity-50 grayscale-[0.5]"
                    )}>
                        
                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                            {mainSections.map((section, sIdx) => (
                                <div key={sIdx} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-accent rounded-full"></span>
                                        {section.title}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                        {section.fields.map((field, fIdx) => (
                                            <div 
                                                key={fIdx} 
                                                className={field.class === 'full' ? 'sm:col-span-2' : 'sm:col-span-1'}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                                                        {field.title}
                                                        {field.valid === 'required' && <span className="text-rose-500 ml-1">*</span>}
                                                    </label>
                                                    {field.tooltip && (
                                                        <div className="group relative">
                                                            <Icon name="info" className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-30">
                                                                {field.tooltip}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {renderFieldInternal(field, formData[field.name], (val) => handleChange(field.name, val))}
                                                {errors[field.name] && (
                                                    <p className="mt-1.5 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                                                        <Icon name="alert-circle" className="w-3 h-3" /> {errors[field.name]}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Sidebar Content */}
                        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
                            {sidebarSections.map((section, sIdx) => (
                                <div key={sIdx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h2 className="text-sm font-bold text-slate-900 mb-5 uppercase tracking-wider border-b border-slate-100 pb-3">
                                        {section.title}
                                    </h2>
                                    <div className="space-y-5">
                                        {section.fields.map((field, fIdx) => (
                                            <div key={fIdx}>
                                                {field.title && (
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                                                        {field.title}
                                                    </label>
                                                )}
                                                {renderFieldInternal(field, formData[field.name], (val) => handleChange(field.name, val))}
                                                {errors[field.name] && (
                                                    <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                                                        <Icon name="alert-circle" className="w-3 h-3" /> {errors[field.name]}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};
