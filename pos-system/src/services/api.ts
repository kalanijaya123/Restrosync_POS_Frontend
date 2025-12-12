// src/services/api.ts
import axios from 'axios'

// Use environment variable with fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add token to requests if available
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Helper to get base API URL for fetch calls
export const getApiUrl = (endpoint: string) => {
    return `${API_URL}/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}

export default api