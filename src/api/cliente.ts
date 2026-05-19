import axios from 'axios'

// Variable global — lee del .env automáticamente según el entorno
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const cliente = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta el token JWT a cada petición automáticamente
cliente.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el token expira, redirige al login
cliente.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default cliente