import React, { useState } from 'react';
import { useCRMStore } from '../store/useStore';
import { LogIn, Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './Icon';
import { useTranslation } from 'react-i18next';

export const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const { login, isLoading } = useCRMStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!email) {
            newErrors.email = t('auth.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = t('auth.emailInvalid');
        }
        if (!password) {
            newErrors.password = t('auth.passwordRequired');
        } else if (password.length < 6) {
            newErrors.password = t('auth.passwordMinLength');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            await login(email, password);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 font-sans selection:bg-accent/30">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="max-w-[440px] w-full bg-[#121214] rounded-[32px] shadow-2xl shadow-black/50 border border-white/5 p-10 md:p-12 relative z-10"
            >
                <div className="mb-12">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-accent/20"
                    >
                        <LogIn className="w-6 h-6 text-white" />
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-bold text-white tracking-tight"
                    >
                        {t('auth.welcome')}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-slate-400 mt-3 text-sm font-medium"
                    >
                        {t('auth.subtitle')}
                    </motion.p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] ml-1">{t('auth.email')}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-accent transition-colors" />
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full pl-12 pr-4 py-4 bg-[#1A1A1E] border ${errors.email ? 'border-rose-500/50' : 'border-white/5'} rounded-2xl text-sm text-white placeholder:text-slate-600 focus:ring-4 focus:ring-accent/10 focus:border-accent/50 transition-all outline-none`}
                                    placeholder="admin@auroparts.com"
                                />
                            </div>
                            {errors.email && <p className="text-[11px] text-rose-500 font-bold ml-1 uppercase tracking-wider">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em]">{t('auth.password')}</label>
                                <a href="#" className="text-[11px] font-bold text-accent hover:text-accent/80 transition-colors uppercase tracking-wider">{t('auth.forgot')}</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-accent transition-colors" />
                                <input 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full pl-12 pr-4 py-4 bg-[#1A1A1E] border ${errors.password ? 'border-rose-500/50' : 'border-white/5'} rounded-2xl text-sm text-white placeholder:text-slate-600 focus:ring-4 focus:ring-accent/10 focus:border-accent/50 transition-all outline-none`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && <p className="text-[11px] text-rose-500 font-bold ml-1 uppercase tracking-wider">{errors.password}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-1">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input type="checkbox" className="peer appearance-none w-5 h-5 rounded-lg border border-white/10 bg-[#1A1A1E] checked:bg-accent checked:border-accent transition-all cursor-pointer" />
                                <Icon name="check" className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                            <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors font-medium">{t('auth.keepSignedIn')}</span>
                        </label>
                    </div>

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-accent hover:opacity-90 disabled:bg-accent/50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-accent/20 transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>{t('auth.signIn')}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <div className="text-center pt-2">
                        <p className="text-sm text-slate-500 font-medium">
                            {t('auth.noAccount')} <a href="#" className="text-accent hover:text-accent/80 transition-colors font-bold">{t('auth.contactSupport')}</a>
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
