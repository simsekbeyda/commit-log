import apiClient from './apiClient';

const BASE_URL = '/api/auth';

export const login = (username, password) => apiClient.post(`${BASE_URL}/login`, { username, password });

export const register = (username, password) => apiClient.post(`${BASE_URL}/register`, { username, password });

/** Örnek günlüklerle dolu, ziyaretçiye özel bir misafir hesabı açar. */
export const startDemo = () => apiClient.post(`${BASE_URL}/demo`);

export const getMe = () => apiClient.get(`${BASE_URL}/me`);
