
import React, { useState, useEffect } from 'react';
import { useCRMStore } from '../store/useStore';
import { Info, Code, Layout, CheckCircle2, HelpCircle } from 'lucide-react';
import { FormSkeleton } from './Skeleton';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export const UsagePage: React.FC = () => {
    const { t } = useTranslation();
    const { schema } = useCRMStore();
    const [isLoading, setIsLoading] = useState(true);

    const FIELD_TYPE_DOCS = {
        text: {
            description: t('usage.fieldDocs.text'),
            options: [t('usage.options.placeholder'), t('usage.options.required'), t('usage.options.tooltip'), t('usage.options.readOnly')]
        },
        number: {
            description: t('usage.fieldDocs.number'),
            options: [t('usage.options.placeholder'), t('usage.options.required'), t('usage.options.tooltip'), t('usage.options.prefix'), t('usage.options.suffix')]
        },
        select: {
            description: t('usage.fieldDocs.select'),
            options: [t('usage.options.options_label_value'), t('usage.options.required'), t('usage.options.tooltip')]
        },
        textarea: {
            description: t('usage.fieldDocs.textarea'),
            options: [t('usage.options.placeholder'), t('usage.options.required'), t('usage.options.tooltip'), t('usage.options.rows')]
        },
        checkbox: {
            description: t('usage.fieldDocs.checkbox'),
            options: [t('usage.options.required'), t('usage.options.tooltip')]
        },
        image: {
            description: t('usage.fieldDocs.image'),
            options: [t('usage.options.required'), t('usage.options.tooltip')]
        },
        gallery: {
            description: t('usage.fieldDocs.gallery'),
            options: [t('usage.options.max_default_10'), t('usage.options.tooltip'), t('usage.options.readOnly')]
        },
        color: {
            description: t('usage.fieldDocs.color'),
            options: [t('usage.options.tooltip')]
        },
        repeater: {
            description: t('usage.fieldDocs.repeater'),
            options: [t('usage.options.fields_nested')]
        },
        variation: {
            description: t('usage.fieldDocs.variation'),
            options: [t('usage.options.columns_table')]
        }
    };

    const DATATABLE_DOCS = {
        DataTable: {
            description: t('usage.datatableDocs.main.description'),
            features: [t('usage.features.sorting'), t('usage.features.filtering'), t('usage.features.pagination'), t('usage.features.bulkActions')]
        },
        columnTypes: {
            description: t('usage.datatableDocs.columnTypes.description'),
            types: [t('usage.types.badge'), t('usage.types.status'), t('usage.types.image'), t('usage.types.text'), t('usage.types.select'), t('usage.types.action'), t('usage.types.manualUpdate')]
        },
        TableFilters: {
            description: t('usage.datatableDocs.filters.description'),
            features: [t('usage.features.searchQuery'), t('usage.features.statusFilter'), t('usage.features.parentIdFilter')]
        }
    };
    
    useEffect(() => {
        const load = async () => {
            if (!schema) return;
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsLoading(false);
        };
        load();
    }, [schema]);

    if (!schema || isLoading) {
        return (
            <div className="flex flex-col h-full bg-[#F8F9FA] text-[#1A1A1A] font-sans">
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-6">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('usage.title')}</h1>
                </div>
                <div className="flex-1 overflow-auto p-8">
                    <FormSkeleton />
                </div>
            </div>
        );
    }

    const formConfig = schema.form["auroparts-product"];

    // Extract all unique field types and their configurations
    const fieldUsages: any[] = [];
    formConfig.forEach((section: any) => {
        section.fields.forEach((field: any) => {
            fieldUsages.push({
                ...field,
                section: section.title
            });
        });
    });

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] text-[#1A1A1A] font-sans">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('usage.title')}</h1>
                <p className="text-sm text-slate-500 mt-1">{t('usage.subtitle')}</p>
            </div>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-5xl mx-auto space-y-12">
                    
                    {/* Field Type Documentation Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-accent" />
                            <h2 className="text-xl font-bold text-slate-900">{t('usage.availableTypes')}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(FIELD_TYPE_DOCS).map(([type, doc], idx) => (
                                <motion.div 
                                    key={type}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="px-2 py-1 bg-accent/10 text-accent rounded text-[10px] font-bold uppercase tracking-wider border border-accent/20">
                                            {type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">{doc.description}</p>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('usage.supportedOptions')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {doc.options.map(opt => (
                                                <span key={opt} className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-[10px] font-medium border border-slate-100">
                                                    {opt}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* DataTable Documentation Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Layout className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-xl font-bold text-slate-900">{t('usage.datatableComponents')}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(DATATABLE_DOCS).map(([name, doc]: [string, any], idx) => (
                                <motion.div 
                                    key={name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                                >
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">{t(`usage.datatableDocs.${name}.title`, name)}</h3>
                                    <p className="text-sm text-slate-600 mb-4">{doc.description}</p>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {doc.features ? t('usage.keyFeatures') : t('usage.availableTypes')}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(doc.features || doc.types).map((item: string) => (
                                                <span key={item} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-medium border border-emerald-100">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('usage.totalFields')}</p>
                            <p className="text-3xl font-bold text-accent">{fieldUsages.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('usage.sections')}</p>
                            <p className="text-3xl font-bold text-emerald-600">{formConfig.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('usage.uniqueTypes')}</p>
                            <p className="text-3xl font-bold text-amber-600">{new Set(fieldUsages.map(f => f.type)).size}</p>
                        </div>
                    </div>

                    {/* Usage Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('usage.fieldTitle')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('usage.type')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('usage.section')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('usage.validation')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('usage.config')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {fieldUsages.map((field, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 text-sm">{field.title || field.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{field.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent uppercase tracking-wide border border-accent/20">
                                                {field.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                            {field.section}
                                        </td>
                                        <td className="px-6 py-4">
                                            {field.valid === 'required' ? (
                                                <span className="inline-flex items-center gap-1 text-rose-500 text-[10px] font-bold uppercase">
                                                    <CheckCircle2 className="w-3 h-3" /> {t('usage.required')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-[10px] font-bold uppercase italic">{t('usage.optional')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {field.tooltip && <Info className="w-4 h-4 text-slate-400" title={field.tooltip} />}
                                                {field.options && <Layout className="w-4 h-4 text-slate-400" title="Has Options" />}
                                                <Code className="w-4 h-4 text-slate-400" title="Custom Attributes" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Schema Preview */}
                    <div className="bg-slate-900 rounded-2xl p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-white font-bold text-lg">{t('usage.rawSchema')}</h2>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('usage.jsonFormat')}</span>
                        </div>
                        <pre className="text-accent/80 font-mono text-xs overflow-auto max-h-[400px] custom-scrollbar">
                            {JSON.stringify(schema.form["auroparts-product"], null, 2)}
                        </pre>
                    </div>

                </div>
            </div>
        </div>
    );
};
