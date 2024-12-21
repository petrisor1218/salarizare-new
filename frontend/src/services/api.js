try {
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://0.0.0.0:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// API methods
const authAPI = {
    login: (credentials) => api.post('/api/auth/login', credentials),
    getCurrentUser: () => api.get('/api/auth/me'),
};

const driversAPI = {
    getAll: (params) => api.get('/api/drivers', { params }),
    getById: (id) => api.get(`/api/drivers/${id}`),
    create: (data) => api.post('/api/drivers', data),
    update: (id, data) => api.patch(`/api/drivers/${id}`, data),
    delete: (id) => api.delete(`/api/drivers/${id}`),
    // Perioade
    getPerioade: (id, params) => api.get(`/api/drivers/${id}/perioade`, { params }),
    addPerioada: (id, data) => api.post(`/api/drivers/${id}/perioade`, data),
    updatePerioada: (id, perioadaId, data) => api.patch(`/api/drivers/${id}/perioade/${perioadaId}`, data),
    deletePerioada: (id, perioadaId) => api.delete(`/api/drivers/${id}/perioade/${perioadaId}`),
    // Salarii
    getSalariu: (id, params) => api.get(`/api/drivers/${id}/salariu`, { params }),
    updateSalariu: (id, data) => api.patch(`/api/drivers/${id}/salariu`, data),
    // Documents
    getDocuments: (id) => api.get(`/api/drivers/${id}/documents`),
    uploadDocument: (id, data) => api.post(`/api/drivers/${id}/documents/upload`, data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),
    updateDocuments: (id, data) => api.patch(`/api/drivers/${id}/documents`, data),
    // Status
    getStatusHistory: (id) => api.get(`/api/drivers/${id}/status-history`),
    updateStatus: (id, status) => api.patch(`/api/drivers/${id}/status`, { status })
};

const dashboardAPI = {
    getStats: () => api.get('/api/dashboard/stats'),
    getActivity: () => api.get('/api/dashboard/activity'),
    getExpiringDocuments: () => api.get('/api/dashboard/documents/expiring'),
    getDriverStatus: () => api.get('/api/dashboard/drivers/status')
};

const salariesAPI = {
    getAll: (filters) => api.get('/api/salaries', { params: filters }),
    getByDriver: (soferId) => api.get(`/api/salaries/sofer/${soferId}`),
    create: (data) => api.post('/api/salaries', data),
    update: (id, data) => api.patch(`/api/salaries/${id}`, data),
    addBonus: (id, data) => api.post(`/api/salaries/${id}/bonus`, data),
    addDeducere: (id, data) => api.post(`/api/salaries/${id}/deducere`, data),
    calculate: (id) => api.post(`/api/salaries/${id}/calculeaza`)
};

const holidaysAPI = {
    getAll: (params) => api.get('/api/holidays', { params }),
    getByDriver: (driverId, params) => api.get(`/api/holidays/driver/${driverId}`, { params }),
    create: (data) => api.post('/api/holidays', data),
    update: (id, data) => api.patch(`/api/holidays/${id}`, data),
    delete: (id) => api.delete(`/api/holidays/${id}`)
};

const finesAPI = {
    getAll: (filters) => api.get('/api/fines', { params: filters }),
    getByDriver: (soferId) => api.get(`/api/fines/sofer/${soferId}`),
    create: (data) => api.post('/api/fines', data),
    update: (id, data) => api.patch(`/api/fines/${id}`, data),
    addPayment: (id, data) => api.post(`/api/fines/${id}/plati`, data),
    addContestation: (id, data) => api.post(`/api/fines/${id}/contestatie`, data)
};

export { 
    api as default, 
    authAPI, 
    driversAPI, 
    dashboardAPI,
    salariesAPI,
    holidaysAPI,
    finesAPI 
};
} catch (error) { console.error(error); }