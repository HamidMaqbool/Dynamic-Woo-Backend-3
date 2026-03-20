import React, { useEffect } from 'react';
import { useCRMStore } from '../store/useStore';
import { Icon } from './Icon';
import { motion } from 'motion/react';
import { Skeleton } from './Skeleton';
import { useTranslation } from 'react-i18next';

export const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const { dashboardData, fetchDashboard } = useCRMStore();

    useEffect(() => {
        if (!dashboardData) {
            fetchDashboard();
        }
    }, [dashboardData, fetchDashboard]);

    if (!dashboardData) {
        return (
            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <Skeleton className="h-64 rounded-2xl" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-80 rounded-2xl" />
                    <Skeleton className="h-80 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 overflow-auto h-full custom-scrollbar">
            <header>
                <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.welcome')}</h1>
                <p className="text-slate-500">{t('dashboard.description')}</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardData.stats.map((stat: any, idx: number) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-accent/10 rounded-lg">
                                <Icon name={stat.icon} className="w-5 h-5 text-accent" />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">{t(`dashboard.${stat.label.toLowerCase().replace(/\s+/g, '_')}`, stat.label)}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-slate-900">{t('dashboard.sales_overview')}</h2>
                        <select className="text-xs font-bold bg-slate-50 border-none rounded-lg focus:ring-0">
                            <option>{t('dashboard.last_7_days')}</option>
                            <option>{t('dashboard.last_30_days')}</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-end gap-2 px-4">
                        {dashboardData.charts.sales.map((val: number, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div 
                                    className="w-full bg-accent/80 rounded-t-lg transition-all group-hover:bg-accent relative"
                                    style={{ height: `${(val / 4000) * 100}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        ${val}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('common.day')} {i+1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="font-bold text-slate-900 mb-6">{t('dashboard.recent_orders')}</h2>
                    <div className="space-y-6">
                        {dashboardData.recentActivity.map((activity: any) => (
                            <div key={activity.id} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <Icon name="user" className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{activity.user}</p>
                                    <p className="text-xs text-slate-500">{activity.action}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-2 text-xs font-bold text-accent bg-accent/10 rounded-xl hover:bg-accent/20 transition-colors">
                        {t('common.viewAll')}
                    </button>
                </div>
            </div>
        </div>
    );
};
