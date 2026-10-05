import apiClient from './apiClient';

const BASE_URL = '/api/ai';

// Sonuçlar sunucuda önbelleğe alınır; refresh=true yeniden üretir
const refreshParams = (refresh) => ({ params: { refresh: refresh || undefined } });

export const getAiStatus = () => apiClient.get(`${BASE_URL}/status`);

export const getSummary = (journalId, refresh) =>
    apiClient.get(`${BASE_URL}/summary/${journalId}`, refreshParams(refresh));

export const getSentiment = (journalId, refresh) =>
    apiClient.get(`${BASE_URL}/sentiment/${journalId}`, refreshParams(refresh));

export const getKeywords = (journalId, refresh) =>
    apiClient.get(`${BASE_URL}/keywords/${journalId}`, refreshParams(refresh));

export const getSuggestion = (journalId, refresh) =>
    apiClient.get(`${BASE_URL}/suggestion/${journalId}`, refreshParams(refresh));

export const getWeeklyReport = (refresh) => apiClient.get(`${BASE_URL}/weekly`, refreshParams(refresh));

export const askQuestion = (journalId, question) => apiClient.post(`${BASE_URL}/ask/${journalId}`, { question });
