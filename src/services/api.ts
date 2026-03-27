
import { error } from 'console';
import { useCRMStore } from '../store/useStore';

interface FetchOptions extends RequestInit {
    params?: Record<string, string>;
}

declare global {
    interface Window {
        APP_CONFIG: {
            API_BASE_URL: string;
        };
    }
}

export async function apiFetch(url: string, options: FetchOptions = {}) {
    const { token, logout, setNotification } = useCRMStore.getState();
   
    const baseUrl = (window.APP_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    let fullUrl = `${baseUrl}${cleanUrl}`;

    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');

    }
    if (options.params) {
        const searchParams = new URLSearchParams(options.params);
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + searchParams.toString();
    }

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            logout();
            setNotification({ message: 'Session expired. Please login again.', type: 'error' });
            if (window.location.pathname !== '/') {
                window.location.href = '/'; // Force redirect
            }
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            setNotification({ message: errorData.message || 'Request failed', type: 'error' });

            throw new Error(errorData.message || 'Request failed');
        }

        const data = await response.json();
      
        if(data.message){
            setNotification({ message: data.message || 'Request successful', type: data.success ? 'success' : 'error' });
        }
        return data;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}
