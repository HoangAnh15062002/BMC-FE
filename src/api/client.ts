import axios from 'axios';

// Utility: convert snake_case keys to camelCase recursively
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function transformKeys(data: any): any {
  if (
    data === null ||
    typeof data !== 'object' ||
    data instanceof Date ||
    data instanceof File ||
    data instanceof Blob ||
    data instanceof ArrayBuffer ||
    data instanceof FormData
  ) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(transformKeys);
  }
  return Object.keys(data).reduce((acc: any, key) => {
    acc[toCamelCase(key)] = transformKeys(data[key]);
    return acc;
  }, {});
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bmc_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Transform snake_case → camelCase + Catch 401
apiClient.interceptors.response.use(
  (response) => {
    if (
      response.config.responseType === 'blob' ||
      response.config.responseType === 'arraybuffer' ||
      response.data instanceof Blob ||
      response.data instanceof ArrayBuffer
    ) {
      return response;
    }
    response.data = transformKeys(response.data);
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('bmc_access_token');
      localStorage.removeItem('bmc_current_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
