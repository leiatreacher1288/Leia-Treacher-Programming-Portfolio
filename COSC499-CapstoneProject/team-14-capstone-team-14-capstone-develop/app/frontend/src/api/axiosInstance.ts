// src/utils/axiosInstance.ts
import axios from 'axios';

const axiosInstance = axios.create({
  // This is the base URL that gets prepended to all API calls.
  // Example: axiosInstance.get('/auth/register') becomes http://localhost:8000/api/auth/register/
  baseURL: '/api', // ✅ Simple relative path
  withCredentials: false, // Don't automatically send cookies, we use token-based auth
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json',
  },
});

// Attach a request interceptor
// This runs before every request made with this Axios instance
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('🌐 Making request to:', (config.baseURL || '') + config.url); // ✅ Add debug logging

    // For admin API calls, we use session cookies (no token needed)
    if (config.url?.includes('/admin/')) {
      console.log('🔐 Admin API call - using session auth');
      // Don't add Authorization header for admin calls
      return config;
    }

    // For regular API calls, use token-based auth
    const token = localStorage.getItem('access');
    if (token) {
      // Add it to the request headers
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Authorization header set:', config.headers.Authorization);
    }
    return config;
  },
  (error) => {
    // If there's an error preparing the request, just pass it through
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.status, response.config.url); // ✅ Add debug logging
    return response;
  },
  async (error) => {
    console.error(
      '❌ Response error:',
      error.response?.status,
      error.config?.url,
      error.message
    ); // ✅ Add debug logging

    if (!error.response) {
      return Promise.reject(error);
    }

    // Save the original request
    const originalRequest = error.config;

    // For admin API calls, handle 401 differently (session-based auth)
    if (originalRequest.url?.includes('/admin/')) {
      console.log(
        '🔐 Admin API 401 - session may have expired, redirecting to admin login'
      );
      if (error.response.status === 401) {
        // For admin calls, redirect to admin login page
        window.location.href = '/admin/login/';
        return Promise.reject(error);
      }
    }

    // For regular API calls, attempt token refresh
    if (!originalRequest._retry && error.response.status === 401) {
      // Mark the request as retried to avoid infinite loops
      originalRequest._retry = true;

      try {
        // Get the refresh token from local storage
        const refreshToken = localStorage.getItem('refresh');
        console.log(
          '🔄 Attempting token refresh with token:',
          refreshToken ? 'present' : 'missing'
        );

        if (refreshToken) {
          // Make a request to the auth server to refresh the access token
          // The call to the backend will only return access token and not
          // refresh token. To get a new refresh token you need to modify
          // the settings and set SIMPLE_JWT to include "ROTATE_REFRESH_TOKENS": True
          const response = await axiosInstance.post('/auth/token/refresh/', {
            refresh: refreshToken,
          });
          const { access: accessToken } = response.data;

          console.log('✅ Token refresh successful');

          // Store the new access token
          localStorage.setItem('access', accessToken);

          // Update the authorization header with the new access token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Retry the original request with the new access token
          return axiosInstance(originalRequest);
        } else {
          console.log('❌ No refresh token available, redirecting to login');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Handle refresh token errors by clearing stored tokens and redirecting to the login page
        console.error('❌ Token refresh failed:', refreshError);
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
export default axiosInstance;
export const API_BASE = '/api';
