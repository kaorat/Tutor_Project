import axios from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) {
    return configured.endsWith('/api') ? configured : `${configured.replace(/\/$/, '')}/api`;
  }
  const localHost = Platform.select({
    ios: 'http://localhost:8080',
    android: 'http://10.0.2.2:8080',
    default: 'http://localhost:8080',
  });
  return `${localHost}/api`;
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    const message = error?.response?.data?.message || 'Network error';
    return Promise.reject({ ...error, message });
  }
);

export default apiClient;
