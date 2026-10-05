import axios from 'axios';
import { translations } from '../i18n/translations';

let currentLanguage = 'en';
let authToken = null;
let onUnauthorized = () => {};

const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
    timeout: 60000,
});

apiClient.interceptors.request.use((config) => {
    // Backend hata mesajlarını ve AI yanıtlarını bu başlığa göre seçili dilde döndürür
    config.headers['Accept-Language'] = currentLanguage;
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
});

// Süresi dolmuş/geçersiz token: oturumu kapat (giriş isteğinin kendi 401'i hariç)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRequest = error.config?.url?.startsWith('/api/auth/');
        if (error.response?.status === 401 && authToken && !isAuthRequest) {
            onUnauthorized();
        }
        return Promise.reject(error);
    },
);

export const setApiLanguage = (lang) => {
    currentLanguage = lang;
};

export const setAuthToken = (token) => {
    authToken = token;
};

export const setUnauthorizedHandler = (handler) => {
    onUnauthorized = handler;
};

/** Backend'in döndürdüğü hata gövdesinden kullanıcıya gösterilecek mesajı çıkarır. */
export const getErrorMessage = (error) => {
    const dict = translations[currentLanguage] || translations.en;
    if (!error?.response) {
        return dict['error.network'];
    }
    const data = error.response.data;
    if (data?.errors && Object.keys(data.errors).length > 0) {
        return Object.values(data.errors).join(' • ');
    }
    return data?.message || dict['error.unexpected'];
};

export default apiClient;
