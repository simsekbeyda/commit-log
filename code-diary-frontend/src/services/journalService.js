import apiClient from './apiClient';

const BASE_URL = '/rest/api/journals';

export const getAllJournals = (page = 0, size = 10, query = '', tag = '') =>
    apiClient.get(BASE_URL, { params: { page, size, q: query || undefined, tag: tag || undefined } });

export const getJournalStats = () => apiClient.get(`${BASE_URL}/stats`);

export const getTags = () => apiClient.get(`${BASE_URL}/tags`);

export const getActivity = (days = 365) => apiClient.get(`${BASE_URL}/activity`, { params: { days } });

export const getJournalById = (id) => apiClient.get(`${BASE_URL}/${id}`);

export const createJournal = (data) => apiClient.post(BASE_URL, data);

export const updateJournal = (id, data) => apiClient.put(`${BASE_URL}/${id}`, data);

export const deleteJournal = (id) => apiClient.delete(`${BASE_URL}/${id}`);
