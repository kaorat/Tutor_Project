import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true, // F5.2: Send HttpOnly cookies
});

API.interceptors.request.use((config) => {
  // Admin tutor-switching: inject tutorId query param
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    try {
      const { state } = JSON.parse(raw);
      if (state?.viewingTutorId) {
        config.params = { ...config.params, tutorId: state.viewingTutorId };
      }
    } catch {}
  }

  return config;
});

// F6.4: Axios interceptors retry (3x)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);
    config.__retryCount = config.__retryCount || 0;

    if (error.response?.status === 401) {
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Retry up to 3 times for server errors
    if (error.response?.status >= 500 && config.__retryCount < 3) {
      config.__retryCount += 1;
      await new Promise(r => setTimeout(r, 1000 * config.__retryCount));
      return API(config);
    }

    return Promise.reject(error);
  }
);

export default API;
