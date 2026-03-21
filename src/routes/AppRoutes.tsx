import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useCRMStore } from '../store/useStore';
import { usePermissions } from '../hooks/usePermissions';
import { Dashboard } from '../components/Dashboard';
import { DataTable } from '../components/datatable/DataTable';
import { DynamicForm } from '../components/DynamicForm';
import { UsagePage } from '../components/UsagePage';
import { Settings } from '../components/Settings';
import MediaPage from '../pages/MediaPage';

const viewMap: Record<string, React.ComponentType<any>> = {
    'dashboard': Dashboard,
    'list': DataTable,
    'usage': UsagePage,
    'settings': Settings,
    'media': MediaPage,
};

export const AppRoutes: React.FC = () => {
    const { routes } = useCRMStore();
    const { hasPermission } = usePermissions();

    if (!routes) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Initializing routes...</p>
                </div>
            </div>
        );
    }

    const dashboardRoute = routes.find(r => r.view === 'dashboard') || routes[0];
    const defaultPath = dashboardRoute?.path || "/dashboard";

    return (
        <div className="h-full overflow-hidden">
            <Routes>
                {/* Only redirect from / if / is not explicitly defined as a route in the config */}
                {!routes.some(r => r.path === '/') && (
                    <Route path="/" element={<Navigate to={defaultPath} replace />} />
                )}
                
                {routes.map((route) => {
                    const Component = viewMap[route.view] || Dashboard;
                    const entity = route.path.substring(1); // e.g., "products" from "/products"
                    
                    // Determine module name for permission check
                    // Usually the entity name, but we can map it if needed
                    const moduleName = entity;
                    
                    // Check if user has permission for this module
                    const canRead = !moduleName || hasPermission(moduleName, 'read');

                    if (!canRead) {
                        return (
                            <React.Fragment key={route.path}>
                                <Route path={route.path} element={<Navigate to={defaultPath} replace />} />
                            </React.Fragment>
                        );
                    }

                    return (
                        <React.Fragment key={route.path}>
                            <Route path={route.path} element={<Component entity={entity} />} />
                            
                            {/* Handle sub-routes for list view (Add/Edit) */}
                            {route.view === 'list' && (
                                <>
                                    <Route 
                                        path={`${route.path}/add`} 
                                        element={hasPermission(moduleName, 'write') ? <DynamicForm entity={entity} /> : <Navigate to={route.path} replace />} 
                                    />
                                    <Route 
                                        path={`${route.path}/edit/:id`} 
                                        element={hasPermission(moduleName, 'write') ? <DynamicForm entity={entity} /> : <Navigate to={route.path} replace />} 
                                    />
                                </>
                            )}
                        </React.Fragment>
                    );
                })}

                {/* Fallback to default path */}
                <Route path="*" element={<Navigate to={defaultPath} replace />} />
            </Routes>
        </div>
    );
};
