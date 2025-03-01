// src/axiosInstance.js
import axios from 'axios';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000', // Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include if using cookie-based auth
});

// Add a request interceptor to include the token
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token'); // Adjust based on your storage method
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
