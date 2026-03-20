
import { useCRMStore } from '../store/useStore';

interface FetchOptions extends RequestInit {
    params?: Record<string, string>;
}

export async function apiFetch(url: string, options: FetchOptions = {}) {
    const { token, logout, setNotification } = useCRMStore.getState();

    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    let fullUrl = url;
    if (options.params) {
        const searchParams = new URLSearchParams(options.params);
        fullUrl += `?${searchParams.toString()}`;
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
            throw new Error(errorData.message || 'Request failed');
        }

        return await response.json();
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}
