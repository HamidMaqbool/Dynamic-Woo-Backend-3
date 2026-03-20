
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCRMStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './Icon';
import { SidebarSkeleton } from './Skeleton';
import { useTranslation } from 'react-i18next';

interface SidebarItemProps {
  item: any;
  closeMobile: () => void;
  isCollapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, closeMobile, isCollapsed }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;

  const isActive = (path: string) => {
    const routePath = path.startsWith('/') ? path : `/${path}`;
    if (routePath === '/') {
      return location.pathname === '/';
    }
    return location.pathname === routePath || location.pathname.startsWith(`${routePath}/`);
  };

  const getRoutePath = (path: string) => {
    if (path.startsWith('/')) return path;
    return `/${path}`;
  };

  return (
    <div 
      className="relative space-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasChildren ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center justify-between gap-4 px-4 py-3 text-sm font-semibold transition-all rounded-xl group",
            "hover:bg-slate-800 text-slate-400 hover:text-slate-200",
            isCollapsed && "justify-center px-0"
          )}
        >
          <div className="flex items-center gap-4">
            {item.icon && <Icon name={item.icon} className={cn("w-5 h-5 text-slate-500 group-hover:text-slate-300", isCollapsed && "w-6 h-6")} />}
            {!isCollapsed && t(`common.${item.title.toLowerCase().replace(/\s+/g, '_')}`, item.title)}
          </div>
          {!isCollapsed && (
            <Icon 
              name={isExpanded ? 'chevron-down' : 'chevron-right'} 
              className={cn("w-4 h-4 transition-transform", isExpanded && "text-accent/80")} 
            />
          )}
        </button>
      ) : (
        <Link
          to={getRoutePath(item.path)}
          onClick={closeMobile}
          className={cn(
            "w-full flex items-center gap-4 px-4 py-3 text-sm font-semibold transition-all rounded-xl group",
            isActive(item.path) ? "bg-accent/10 text-accent" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200",
            isCollapsed && "justify-center px-0"
          )}
        >
          {item.icon && <Icon name={item.icon} className={cn("w-5 h-5", isActive(item.path) ? "text-accent" : "text-slate-500 group-hover:text-slate-300", isCollapsed && "w-6 h-6")} />}
          {!isCollapsed && t(`common.${item.title.toLowerCase().replace(/\s+/g, '_')}`, item.title)}
        </Link>
      )}

      {/* Hover Submenu for Collapsed State */}
      <AnimatePresence>
        {isCollapsed && hasChildren && isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute left-full top-0 ml-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-50 p-2"
          >
            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 mb-2">
              {t(`common.${item.title.toLowerCase().replace(/\s+/g, '_')}`, item.title)}
            </div>
            {item.children.map((child: any, idx: number) => (
              <Link
                key={idx}
                to={getRoutePath(child.path)}
                onClick={closeMobile}
                className="w-full block text-left px-3 py-2 text-xs font-medium text-slate-400 hover:text-accent hover:bg-slate-700/50 rounded-lg transition-all"
              >
                {t(`common.${child.title.toLowerCase().replace(/\s+/g, '_')}`, child.title)}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Submenu for Normal State */}
      <AnimatePresence>
        {!isCollapsed && hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-10 space-y-1"
          >
            {item.children.map((child: any, idx: number) => (
              <Link
                key={idx}
                to={getRoutePath(child.path)}
                onClick={closeMobile}
                className="w-full block text-left px-4 py-2 text-xs font-medium text-slate-500 hover:text-accent transition-colors"
              >
                {t(`common.${child.title.toLowerCase().replace(/\s+/g, '_')}`, child.title)}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Sidebar: React.FC = () => {
    const { t } = useTranslation();
    const { sidebarData, isSidebarLoading, fetchSidebar, settingsData, fetchSettings, logout, user } = useCRMStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [logos, setLogos] = useState({ big: '', collapsed: '' });
    const location = useLocation();

    useEffect(() => {
        if (sidebarData.length === 0) {
            fetchSidebar();
        }
        if (!settingsData) {
            fetchSettings();
        }
    }, [fetchSidebar, fetchSettings, settingsData, sidebarData.length]);

    useEffect(() => {
        if (settingsData && settingsData.tabs) {
            const appearanceTab = settingsData.tabs.find((t: any) => t.id === 'appearance');
            if (appearanceTab) {
                const sidebarSection = appearanceTab.sections.find((s: any) => s.title === 'Sidebar');
                if (sidebarSection) {
                    const collapsedField = sidebarSection.fields.find((f: any) => f.name === 'sidebarCollapsed');
                    if (collapsedField) {
                        setIsCollapsed(!!collapsedField.value);
                    }
                }
            }

            const mediaTab = settingsData.tabs.find((t: any) => t.id === 'media');
            if (mediaTab) {
                const brandingSection = mediaTab.sections.find((s: any) => s.title === 'Branding Logos');
                if (brandingSection) {
                    const bigLogo = brandingSection.fields.find((f: any) => f.name === 'sidebarLogoBig')?.value;
                    const smallLogo = brandingSection.fields.find((f: any) => f.name === 'sidebarLogoCollapsed')?.value;
                    setLogos({ big: bigLogo || '', collapsed: smallLogo || '' });
                }
            }
        }
    }, [settingsData]);

    const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
        <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
            {/* Logo */}
            <div className={cn("p-8 border-b border-slate-800", collapsed && "p-4 flex justify-center")}>
                <Link to="/dashboard" className="flex items-center gap-3">
                    {collapsed ? (
                        logos.collapsed ? (
                            <img src={logos.collapsed} alt="Logo" className="w-9 h-9 object-contain" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 shrink-0">
                                <Icon name="package" className="w-5 h-5 text-white" />
                            </div>
                        )
                    ) : (
                        <>
                            {logos.big ? (
                                <img src={logos.big} alt="Logo" className="h-9 object-contain" referrerPolicy="no-referrer" />
                            ) : (
                                <>
                                    <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 shrink-0">
                                        <Icon name="package" className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xl font-bold tracking-tight text-white">AURO<span className="text-accent">CRM</span></span>
                                </>
                            )}
                        </>
                    )}
                </Link>
            </div>

            {/* Nav */}
            <nav className={cn(
                "flex-1 p-6 space-y-2 custom-scrollbar", 
                collapsed ? "p-2 overflow-y-visible" : "overflow-y-auto",
                collapsed && "flex flex-col items-center"
            )}>
                {isSidebarLoading ? (
                    <SidebarSkeleton />
                ) : (
                    sidebarData.map((item, idx) => (
                        <SidebarItem 
                          key={idx} 
                          item={item} 
                          closeMobile={() => setIsOpen(false)} 
                          isCollapsed={collapsed}
                        />
                    ))
                )}
            </nav>

           

            {/* User Profile */}
            {!collapsed && user && (
                <div className="px-6 py-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-bold">
                            {user.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className={cn("p-6 border-t border-slate-800 space-y-2", collapsed && "p-2")}>
                <Link 
                    to="/settings"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                        "w-full flex items-center gap-4 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all",
                        location.pathname === '/settings' ? "bg-accent/10 text-accent" : "",
                        collapsed && "justify-center px-0"
                    )}
                >
                    <Icon name="settings" className={cn("w-5 h-5", location.pathname === '/settings' ? "text-accent" : "")} />
                    {!collapsed && t('common.settings', 'Settings')}
                </Link>
                <button 
                    onClick={logout}
                    className={cn(
                        "w-full flex items-center gap-4 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 rounded-xl transition-all",
                        collapsed && "justify-center px-0"
                    )}
                >
                    <Icon name="log-out" className="w-5 h-5" />
                    {!collapsed && t('common.logout', 'Logout')}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={cn(
                "hidden lg:block h-full shrink-0 transition-all duration-300",
                isCollapsed ? "w-20" : "w-64"
            )}>
                <SidebarContent collapsed={isCollapsed} />
                {/* Collapse Toggle */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="fixed bottom-24 left-64 -translate-x-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-accent shadow-sm z-50 transition-all"
                    style={{ left: isCollapsed ? '80px' : '256px' }}
                >
                    <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} className="w-4 h-4" />
                </button>
            </div>

            {/* Mobile Menu Button (Hamburger) */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 active:scale-95 transition-transform"
                >
                    <Icon name={isOpen ? 'x' : 'menu-compact'} className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.div 
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden shadow-2xl"
                        >
                            <SidebarContent />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
