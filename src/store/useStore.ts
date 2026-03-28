
import { create } from 'zustand';
import { apiFetch } from '../services/api';

export interface Variation {
    id: string;
    combination: string[];
    price: string;
    sku: string;
    inventory: number;
    image?: string;
    isDefault?: boolean;
}

export interface Product {
    id: string;
    image: string;
    identifier: string;
    parent_id: string;
    title: string;
    product_type: 'simple' | 'variation';
    status: 'publish' | 'draft' | 'deleted';
    created_at: string;
    variations?: {
        options: { name: string; values: string[] }[];
        variants: Variation[];
    };
    [key: string]: any;
}

interface CRMState {
    items: any[];
    isLoading: boolean;
    sidebarData: any[];
    isSidebarLoading: boolean;
    dashboardData: any | null;
    settingsData: any | null;
    schema: any | null;
    routes: any[] | null;
    selectedIds: string[];
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    searchQuery: string;
    filters: Record<string, any>;
    sortBy: string | null;
    sortOrder: 'asc' | 'desc';
    theme: 'light' | 'dark' | 'red' | 'green';
    language: string;
    direction: 'ltr' | 'rtl';
    editingItem: any | null;
    notifications: { id: string; message: string; type: 'success' | 'error' }[];
    
    // Auth
    isAuthenticated: boolean;
    token: string | null;
    user: { 
        email: string; 
        name: string; 
        role: string; 
        permissions?: { module: string; access: string }[];
        accessibleMenus?: { path: string }[];
    } | null;
    
    // Actions
    fetchData: (entity: string) => Promise<void>;
    fetchSidebar: () => Promise<void>;
    fetchDashboard: () => Promise<void>;
    fetchSettings: () => Promise<void>;
    updateSettings: (settings: any) => Promise<void>;
    fetchSchema: () => Promise<void>;
    fetchRoutes: () => Promise<void>;
    fetchItemById: (entity: string, id: string) => Promise<any | null>;
    setItems: (items: any[]) => void;
    addItem: (entity: string, item: any) => Promise<void>;
    updateItem: (entity: string, id: string, item: Partial<any>) => Promise<void>;
    deleteItem: (entity: string, id: string) => Promise<void>;
    bulkDeleteItems: (entity: string, ids: string[]) => Promise<void>;
    setSelectedIds: (ids: string[]) => void;
    setCurrentPage: (page: number) => void;
    setItemsPerPage: (count: number) => void;
    setSearchQuery: (query: string) => void;
    setFilters: (filters: Partial<CRMState['filters']>) => void;
    resetFilters: (initialFilters?: Record<string, any>) => void;
    setSort: (sortBy: string | null, sortOrder?: 'asc' | 'desc') => void;
    setTheme: (theme: CRMState['theme']) => void;
    addNotification: (message: string, type: 'success' | 'error') => void;
    removeNotification: (id: string) => void;
    setNotification: (notif: { message: string, type: 'success' | 'error' } | null) => void;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

export const useCRMStore = create<CRMState>((set, get) => ({
    items: [],
    isLoading: false,
    sidebarData: [],
    isSidebarLoading: false,
    dashboardData: null,
    settingsData: null,
    schema: null,
    routes: null,
    selectedIds: [],
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
    searchQuery: '',
    filters: {
        status: 'all',
        parentId: 'all',
    },
    sortBy: null,
    sortOrder: 'asc',
    theme: (localStorage.getItem('crm-theme') as any) || 'light',
    language: localStorage.getItem('crm-lang') || 'en',
    direction: (localStorage.getItem('crm-dir') as any) || 'ltr',
    editingItem: null,
    notifications: [],
    isAuthenticated: !!localStorage.getItem('crm-token'),
    token: localStorage.getItem('crm-token'),
    user: JSON.parse(localStorage.getItem('crm-user') || 'null'),

    fetchData: async (entity) => {
        set({ isLoading: true });
        const { currentPage, itemsPerPage, searchQuery, filters, sortBy, sortOrder } = get();
        try {
            const data = await apiFetch(`/api/${entity}`, {
                params: {
                    page: currentPage.toString(),
                    limit: itemsPerPage.toString(),
                    search: searchQuery,
                    sortBy: sortBy || '',
                    sortOrder: sortOrder,
                    ...filters
                }
            });
            set({ 
                items: data[entity] || data.items || [], 
                totalItems: data.total || 0,
                totalPages: data.totalPages || 0,
                isLoading: false 
            });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    fetchSidebar: async () => {
        set({ isSidebarLoading: true });
        try {
            const data = await apiFetch('/api/sidebar');
            set({ sidebarData: data, isSidebarLoading: false });
        } catch (error) {
            set({ isSidebarLoading: false });
        }
    },

    fetchDashboard: async () => {
        try {
            const data = await apiFetch('/api/dashboard');
            set({ dashboardData: data });
        } catch (error) {}
    },

    fetchSettings: async () => {
        try {
            const data = await apiFetch('/api/settings');
            set({ settingsData: data });
            
            // Sync language and direction from settings
            const localizationTab = data.tabs?.find((t: any) => t.id === 'localization');
            if (localizationTab) {
                const langField = localizationTab.sections[0].fields.find((f: any) => f.name === 'language');
                const dirField = localizationTab.sections[0].fields.find((f: any) => f.name === 'direction');
                if (langField) {
                    localStorage.setItem('crm-lang', langField.value);
                    set({ language: langField.value });
                }
                if (dirField) {
                    localStorage.setItem('crm-dir', dirField.value);
                    set({ direction: dirField.value });
                }
            }
        } catch (error) {}
    },

    updateSettings: async (settings: any) => {
        set({ isLoading: true });
        try {
            const data = await apiFetch('/api/settings', {
                method: 'PUT',
                body: JSON.stringify(settings)
            });
            set({ 
                settingsData: data, 
                isLoading: false,
            });

            // Sync language and direction from updated settings
            const localizationTab = data.tabs?.find((t: any) => t.id === 'localization');
            if (localizationTab) {
                const langField = localizationTab.sections[0].fields.find((f: any) => f.name === 'language');
                const dirField = localizationTab.sections[0].fields.find((f: any) => f.name === 'direction');
                if (langField) {
                    localStorage.setItem('crm-lang', langField.value);
                    set({ language: langField.value });
                }
                if (dirField) {
                    localStorage.setItem('crm-dir', dirField.value);
                    set({ direction: dirField.value });
                }
            }

            get().addNotification('Settings updated successfully', 'success');
        } catch (error) {
            set({ isLoading: false });
        }
    },

    fetchSchema: async () => {
        try {
            const data = await apiFetch('/api/schema');
            set({ schema: data });
        } catch (error) {}
    },

    fetchRoutes: async () => {
        try {
            const data = await apiFetch('/api/routes');
            set({ routes: data });
        } catch (error) {}
    },

    fetchItemById: async (entity, id) => {
        set({ isLoading: true });
        try {
            const data = await apiFetch(`/api/${entity}/${id}`);
            set({ editingItem: data, isLoading: false });
            return data;
        } catch (error) {
            set({ isLoading: false });
            get().addNotification('Item not found', 'error');
            return null;
        }
    },

    setItems: (items) => set({ items }),
    addItem: async (entity, item) => {
        set({ isLoading: true });
        try {
            const data = await apiFetch(`/api/${entity}`, {
                method: 'POST',
                body: JSON.stringify(item)
            });
            set((state) => ({ 
                items: [data, ...state.items],
                isLoading: false,
            }));
            get().addNotification('Item added successfully', 'success');
            get().fetchData(entity);
        } catch (error) {
            set({ isLoading: false });
        }
    },
    updateItem: async (entity, id, updatedFields) => {
        set({ isLoading: true });
        try {
            const data = await apiFetch(`/api/${entity}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedFields)
            });
            set((state) => ({
                items: state.items.map(p => p.id === id ? data : p),
                isLoading: false,
            }));
            get().addNotification('Item updated successfully', 'success');
            get().fetchData(entity);
        } catch (error) {
            set({ isLoading: false });
        }
    },
    deleteItem: async (entity, id) => {
        set({ isLoading: true });
        try {
            await apiFetch(`/api/${entity}/${id}`, { method: 'DELETE' });
            set((state) => ({
                items: state.items.filter(p => p.id !== id),
                isLoading: false,
            }));
            get().addNotification('Item deleted successfully', 'success');
            get().fetchData(entity);
        } catch (error) {
            set({ isLoading: false });
        }
    },
    bulkDeleteItems: async (entity, ids) => {
        set({ isLoading: true });
        try {
            await apiFetch(`/api/${entity}/bulk-delete`, { 
                method: 'POST',
                body: JSON.stringify({ ids })
            });
            set((state) => ({
                items: state.items.filter(p => !ids.includes(p.id)),
                isLoading: false,
                selectedIds: [],
            }));
            get().addNotification(`${ids.length} items deleted successfully`, 'success');
            get().fetchData(entity);
        } catch (error) {
            set({ isLoading: false });
        }
    },
    setSelectedIds: (ids) => set({ selectedIds: ids }),
    setCurrentPage: (page) => {
        set({ currentPage: page });
    },
    setItemsPerPage: (count) => {
        set({ itemsPerPage: count, currentPage: 1 });
    },
    setSearchQuery: (query) => {
        set({ searchQuery: query, currentPage: 1 });
    },
    setFilters: (filters) => {
        set((state) => ({ 
            filters: { ...state.filters, ...filters },
            currentPage: 1 
        }));
    },
    resetFilters: (initialFilters) => {
        set({ 
            filters: initialFilters || { status: 'all', parentId: 'all' },
            currentPage: 1 
        });
    },
    setSort: (sortBy, sortOrder) => {
        set((state) => ({
            sortBy,
            sortOrder: sortOrder || (state.sortBy === sortBy && state.sortOrder === 'asc' ? 'desc' : 'asc'),
            currentPage: 1
        }));
    },
    setTheme: (theme) => {
        localStorage.setItem('crm-theme', theme);
        set({ theme });
    },
    addNotification: (message, type) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
            notifications: [...state.notifications, { id, message, type }]
        }));
    },
    removeNotification: (id) => {
        set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
        }));
    },
    setNotification: (notification) => {
        if (notification) {
            get().addNotification(notification.message, notification.type);
        }
    },
    
    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const data = await apiFetch('/api/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            if (data.success) {
                localStorage.setItem('crm-token', data.token);
                localStorage.setItem('crm-user', JSON.stringify(data.user));
                set({ 
                    isAuthenticated: true, 
                    user: data.user,
                    token: data.token,
                    isLoading: false 
                });
                return true;
            } else {
                set({ isLoading: false });
                get().addNotification(data.message || 'Login failed', 'error');
                return false;
            }
        } catch (error) {
            console.error("Login error", error);
            set({ isLoading: false });
            get().addNotification(error instanceof Error ? error.message : 'An error occurred during login', 'error');
            return false;
        }
    },
    logout: () => {
        localStorage.removeItem('crm-token');
        localStorage.removeItem('crm-user');
        set({ isAuthenticated: false, user: null, token: null });
    },
}));
