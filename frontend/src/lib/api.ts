import { supabase } from './supabase';

// NEXT_PUBLIC_API_URL yoksa aynı origin'deki Next.js API route'larını kullan
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Get auth token from Supabase session
 */
async function getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add Authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Next.js API route'ları her zaman aynı origin'den çağrılsın (cookie + proxy için)
    const isLocalApiRoute = endpoint.startsWith('/api/');
    const url = endpoint.startsWith('http')
      ? endpoint
      : isLocalApiRoute
      ? endpoint
      : `${API_BASE}${endpoint}`;
    
    // Add 60 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // Handle non-OK responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: response.statusText
            }));

            // Handle 401 Unauthorized - do NOT redirect here (handled by AuthWrapper)
            if (response.status === 401) {
                console.warn('API 401 Unauthorized, throwing error to be handled by application');
            }

            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse JSON response safely
        const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
        return data;
    } catch (error: any) {
        const msg = error?.message || String(error);
        const isExpectedVerify404 =
          msg.includes('HTTP 404') &&
          url.includes('/api/auth/verify');
        if (isExpectedVerify404) {
          throw error;
        }
        const isNetwork =
          error?.name === 'TypeError' ||
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError') ||
          msg.includes('Load failed');
        if (isNetwork) {
          console.warn('API isteği (ağ):', msg, url);
        } else {
          console.error('API Request Error:', error);
        }
        throw error;
    }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
    get: <T = any>(endpoint: string, options?: RequestInit) =>
        apiRequest<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        }),

    put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        }),

    patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        }),

    delete: <T = any>(endpoint: string, options?: RequestInit) =>
        apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
