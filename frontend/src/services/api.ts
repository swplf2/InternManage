import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Simple cache for GET requests
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increase timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and handle caching
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add cache handling for GET requests
    if (config.method === 'get') {
      const cacheKey = `${config.url}?${new URLSearchParams(config.params).toString()}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        // Return cached data by throwing a custom error that we'll catch
        const cancelToken = axios.CancelToken.source();
        config.cancelToken = cancelToken.token;
        
        // Schedule the cancellation with cached data
        setTimeout(() => {
          cancelToken.cancel(JSON.stringify({ cached: true, data: cachedData.data }));
        }, 0);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and caching
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Cache GET requests
    if (response.config.method === 'get') {
      const cacheKey = `${response.config.url}?${new URLSearchParams(response.config.params).toString()}`;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  (error) => {    // Handle cached responses
    if (axios.isCancel(error)) {
      try {
        const errorMessage = error.message;
        if (errorMessage) {
          const cancelData = JSON.parse(errorMessage);
          if (cancelData.cached) {
            return Promise.resolve({ data: cancelData.data } as AxiosResponse);
          }
        }
      } catch {
        // Not a cached response, handle as normal cancellation
      }
    }

    // Handle 429 (Too Many Requests) with retry
    if (error.response?.status === 429) {
      console.warn('Rate limit hit, retrying in 1 second...');
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          apiClient.request(error.config)
            .then(resolve)
            .catch(reject);
        }, 1000);
      });
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle CORS/Network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Network error - check if backend server is running');
    }

    return Promise.reject(error);
  }
);

// Clear cache function
export const clearCache = () => {
  cache.clear();
};

export default apiClient;
