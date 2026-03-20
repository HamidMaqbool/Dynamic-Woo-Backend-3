import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './Icon';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-8">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                                type === 'danger' ? 'bg-rose-50 text-rose-600' : 
                                type === 'warning' ? 'bg-amber-50 text-amber-600' : 
                                'bg-accent/10 text-accent'
                            }`}>
                                <Icon name={type === 'danger' ? 'trash-2' : 'alert-triangle'} className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                            <p className="text-slate-500 leading-relaxed">{message}</p>
                        </div>
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-2xl transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`flex-1 px-6 py-3 text-sm font-bold text-white rounded-2xl shadow-lg transition-all ${
                                    type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 
                                    type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 
                                    'bg-accent hover:opacity-90 shadow-accent/20'
                                }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
