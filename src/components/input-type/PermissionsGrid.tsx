
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';

interface Permission {
    module: string;
    access: 'read' | 'write' | 'none';
}

interface MenuAccess {
    path: string;
}

interface PermissionsGridProps {
    value: {
        permissions?: Permission[];
        accessible_menus?: MenuAccess[];
    };
    onChange: (value: any) => void;
    readOnly?: boolean;
}

interface AvailableData {
    modules: { id: string; label: string }[];
    menus: { path: string; label: string }[];
}

export const PermissionsGrid: React.FC<PermissionsGridProps> = ({ value, onChange, readOnly }) => {
    const [available, setAvailable] = useState<AvailableData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAvailable = async () => {
            try {
                const data = await apiFetch('/api/available-permissions');
                setAvailable(data);
            } catch (err) {
                console.error('Error fetching available permissions:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAvailable();
    }, []);

    const handlePermissionChange = (moduleId: string, access: 'read' | 'write' | 'none') => {
        if (readOnly) return;
        const currentPermissions = value.permissions || [];
        const existingIdx = currentPermissions.findIndex(p => p.module === moduleId);
        
        let newPermissions = [...currentPermissions];
        if (existingIdx >= 0) {
            newPermissions[existingIdx] = { ...newPermissions[existingIdx], access };
        } else {
            newPermissions.push({ module: moduleId, access });
        }
        
        onChange({ ...value, permissions: newPermissions });
    };

    const handleMenuToggle = (path: string) => {
        if (readOnly) return;
        const currentMenus = value.accessible_menus || [];
        const isAccessible = currentMenus.some(m => m.path === path);
        
        let newMenus;
        if (isAccessible) {
            newMenus = currentMenus.filter(m => m.path !== path);
        } else {
            newMenus = [...currentMenus, { path }];
        }
        
        onChange({ ...value, accessible_menus: newMenus });
    };

    if (isLoading) {
        return <div className="p-4 text-center text-slate-400">Loading permissions...</div>;
    }

    if (!available) {
        return <div className="p-4 text-center text-rose-400">Failed to load permissions.</div>;
    }

    return (
        <div className="space-y-8">
            {/* Module Permissions */}
            <div>
                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Icon name="shield" className="w-4 h-4 text-accent" />
                    Module Permissions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {available.modules.map(module => {
                        const currentAccess = value.permissions?.find(p => p.module === module.id)?.access || 'none';
                        return (
                            <div key={module.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-600">{module.label}</span>
                                <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                                    {(['none', 'read', 'write'] as const).map(access => (
                                        <button
                                            key={access}
                                            type="button"
                                            onClick={() => handlePermissionChange(module.id, access)}
                                            className={cn(
                                                "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                                                currentAccess === access 
                                                    ? (access === 'none' ? "bg-slate-200 text-slate-600" : "bg-accent text-white shadow-sm shadow-accent/20")
                                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                            )}
                                        >
                                            {access}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Menu Access */}
            <div>
                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Icon name="menu" className="w-4 h-4 text-accent" />
                    Accessible Menus
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {available.menus.map(menu => {
                        const isAccessible = value.accessible_menus?.some(m => m.path === menu.path);
                        return (
                            <button
                                key={menu.path}
                                type="button"
                                onClick={() => handleMenuToggle(menu.path)}
                                className={cn(
                                    "p-3 text-xs font-semibold rounded-xl border transition-all text-left flex items-center gap-2",
                                    isAccessible 
                                        ? "bg-accent/5 border-accent/30 text-accent" 
                                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                                    isAccessible ? "bg-accent border-accent text-white" : "border-slate-300 bg-white"
                                )}>
                                    {isAccessible && <Icon name="check" className="w-3 h-3" />}
                                </div>
                                {menu.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
