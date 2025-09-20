import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:3000/api';

// Create a custom hook for authenticated API calls
export const useAuthenticatedFetch = () => {
  const { token } = useAuth();

  const authenticatedFetch = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If token is invalid or expired, the response will be 401/403
    if (response.status === 401 || response.status === 403) {
      // Clear the token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return response;
  };

  return authenticatedFetch;
};

// Utility functions for common API operations
export const apiUtils = {
  // GET request
  get: async (endpoint: string, token?: string): Promise<Response> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return response;
  },

  // POST request
  post: async (endpoint: string, data: any, token?: string): Promise<Response> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return response;
  },

  // PUT request
  put: async (endpoint: string, data: any, token?: string): Promise<Response> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return response;
  },

  // DELETE request
  delete: async (endpoint: string, token?: string): Promise<Response> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return response;
  },

  // File upload with FormData
  upload: async (endpoint: string, formData: FormData, token?: string): Promise<Response> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return response;
  },
};
