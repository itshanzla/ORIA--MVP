import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('oria_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('oria_token');
            localStorage.removeItem('oria_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    signup: (data) => apiClient.post('/auth/signup', data),
    login: (data) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
};

// Nexus API
export const nexusAPI = {
    createAccount: (data) => apiClient.post('/nexus/create-account', data),
    login: (data) => apiClient.post('/nexus/login', data),
    getStatus: () => apiClient.get('/nexus/status'),
};

export default apiClient;
