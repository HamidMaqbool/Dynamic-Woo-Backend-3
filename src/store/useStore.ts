
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
    products: Product[];
    isLoading: boolean;
    sidebarData: any[];
    isSidebarLoading: boolean;
    dashboardData: any | null;
    settingsData: any | null;
    schema: any | null;
    routes: any[] | null;
    selectedProductIds: string[];
    currentPage: number;
    itemsPerPage: number;
    totalProducts: number;
    totalPages: number;
    searchQuery: string;
    filters: {
        status: string;
        parentId: string;
    };
    theme: 'light' | 'dark' | 'red' | 'green';
    language: string;
    direction: 'ltr' | 'rtl';
    editingProduct: Product | null;
    notifications: { id: string; message: string; type: 'success' | 'error' }[];
    
    // Auth
    isAuthenticated: boolean;
    token: string | null;
    user: { email: string; name: string } | null;
    
    // Actions
    fetchProducts: () => Promise<void>;
    fetchSidebar: () => Promise<void>;
    fetchDashboard: () => Promise<void>;
    fetchSettings: () => Promise<void>;
    updateSettings: (settings: any) => Promise<void>;
    fetchSchema: () => Promise<void>;
    fetchRoutes: () => Promise<void>;
    fetchProductById: (id: string) => Promise<Product | null>;
    setProducts: (products: Product[]) => void;
    addProduct: (product: Product) => void;
    updateProduct: (id: string, product: Partial<Product>) => void;
    deleteProduct: (id: string) => Promise<void>;
    bulkDeleteProducts: (ids: string[]) => Promise<void>;
    setSelectedProductIds: (ids: string[]) => void;
    setCurrentPage: (page: number) => void;
    setItemsPerPage: (count: number) => void;
    setSearchQuery: (query: string) => void;
    setFilters: (filters: Partial<CRMState['filters']>) => void;
    setTheme: (theme: CRMState['theme']) => void;
    addNotification: (message: string, type: 'success' | 'error') => void;
    removeNotification: (id: string) => void;
    setNotification: (notif: { message: string, type: 'success' | 'error' } | null) => void;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

export const useCRMStore = create<CRMState>((set, get) => ({
    products: [],
    isLoading: false,
    sidebarData: [],
    isSidebarLoading: false,
    dashboardData: null,
    settingsData: null,
    schema: null,
    routes: null,
    selectedProductIds: [],
    currentPage: 1,
    itemsPerPage: 10,
    totalProducts: 0,
    totalPages: 0,
    searchQuery: '',
    filters: {
        status: 'all',
        parentId: 'all',
    },
    theme: (localStorage.getItem('crm-theme') as any) || 'light',
    language: localStorage.getItem('crm-lang') || 'en',
    direction: (localStorage.getItem('crm-dir') as any) || 'ltr',
    editingProduct: null,
    notifications: [],
    isAuthenticated: !!localStorage.getItem('crm-token'),
    token: localStorage.getItem('crm-token'),
    user: JSON.parse(localStorage.getItem('crm-user') || 'null'),

    fetchProducts: async () => {
        set({ isLoading: true });
        const { currentPage, itemsPerPage, searchQuery, filters } = get();
        try {
            const data = await apiFetch('/api/products', {
                params: {
                    page: currentPage.toString(),
                    limit: itemsPerPage.toString(),
                    search: searchQuery,
                    status: filters.status,
                    parentId: filters.parentId
                }
            });
            set({ 
                products: data.products, 
                totalProducts: data.total,
                totalPages: data.totalPages,
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
            const localizationTab = data.tabs.find((t: any) => t.id === 'localization');
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
            const localizationTab = data.tabs.find((t: any) => t.id === 'localization');
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

    fetchProductById: async (id: string) => {
        set({ isLoading: true });
        try {
            const data = await apiFetch(`/api/products/${id}`);
            set({ editingProduct: data, isLoading: false });
            return data;
        } catch (error) {
            set({ isLoading: false });
            get().addNotification('Product not found', 'error');
            return null;
        }
    },

    setProducts: (products) => set({ products }),
    addProduct: async (product) => {
        set({ isLoading: true });
        try {
            const data = await apiFetch('/api/products', {
                method: 'POST',
                body: JSON.stringify(product)
            });
            set((state) => ({ 
                products: [data, ...state.products],
                isLoading: false,
            }));
            get().addNotification('Product added successfully', 'success');
            get().fetchProducts();
        } catch (error) {
            set({ isLoading: false });
        }
    },
    updateProduct: async (id, updatedFields) => {
        set({ isLoading: true });
        try {
            const data = await apiFetch(`/api/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedFields)
            });
            set((state) => ({
                products: state.products.map(p => p.id === id ? data : p),
                isLoading: false,
            }));
            get().addNotification('Product updated successfully', 'success');
            get().fetchProducts();
        } catch (error) {
            set({ isLoading: false });
        }
    },
    deleteProduct: async (id) => {
        set({ isLoading: true });
        try {
            await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
            set((state) => ({
                products: state.products.filter(p => p.id !== id),
                isLoading: false,
            }));
            get().addNotification('Product deleted successfully', 'success');
            get().fetchProducts();
        } catch (error) {
            set({ isLoading: false });
        }
    },
    bulkDeleteProducts: async (ids) => {
        set({ isLoading: true });
        try {
            await apiFetch('/api/products/bulk-delete', { 
                method: 'POST',
                body: JSON.stringify({ ids })
            });
            set((state) => ({
                products: state.products.filter(p => !ids.includes(p.id)),
                isLoading: false,
                selectedProductIds: [],
            }));
            get().addNotification(`${ids.length} products deleted successfully`, 'success');
            get().fetchProducts();
        } catch (error) {
            set({ isLoading: false });
        }
    },
    setSelectedProductIds: (ids) => set({ selectedProductIds: ids }),
    setCurrentPage: (page) => {
        set({ currentPage: page });
        get().fetchProducts();
    },
    setItemsPerPage: (count) => {
        set({ itemsPerPage: count, currentPage: 1 });
        get().fetchProducts();
    },
    setSearchQuery: (query) => {
        set({ searchQuery: query, currentPage: 1 });
        get().fetchProducts();
    },
    setFilters: (filters) => {
        set((state) => ({ 
            filters: { ...state.filters, ...filters },
            currentPage: 1 
        }));
        get().fetchProducts();
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
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
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
            get().addNotification('An error occurred during login', 'error');
            return false;
        }
    },
    logout: () => {
        localStorage.removeItem('crm-token');
        localStorage.removeItem('crm-user');
        set({ isAuthenticated: false, user: null, token: null });
    },
}));
